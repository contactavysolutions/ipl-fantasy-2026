// netlify/functions/lib/insights.mjs
// Shared logic for generating and storing AI match insights

const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

const TEAMS = {
  RCB: "Royal Challengers Bengaluru",
  MI: "Mumbai Indians",
  CSK: "Chennai Super Kings",
  KKR: "Kolkata Knight Riders",
  SRH: "Sunrisers Hyderabad",
  DC: "Delhi Capitals",
  GT: "Gujarat Titans",
  RR: "Rajasthan Royals",
  PBKS: "Punjab Kings",
  LSG: "Lucknow Super Giants",
};

export async function supabaseQuery(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return res.json();
}

export async function supabaseUpsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=match_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  // Try to get key from environment
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY missing in environment" };
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) scheduled on ${matchDate}:

Search for the LATEST cricket news and provide:
1. PROBABLE PLAYING XI for both teams (11 players each).
2. IN-FORM BATSMEN and BOWLERS for both teams (with recent stats).
3. PITCH REPORT and Venue analysis.
4. HEAD TO HEAD summary.
5. KEY MATCHUPS to watch.
6. PREDICTION SUMMARY.

IMPORTANT: Return your response ONLY as a valid JSON object with exactly these keys:
{
  "home_probable_xi": ["Full Name 1", ...],
  "away_probable_xi": ["Full Name 1", ...],
  "home_form_batsmen": "...",
  "away_form_batsmen": "...",
  "home_form_bowlers": "...",
  "away_form_bowlers": "...",
  "pitch_report": "...",
  "head_to_head": "...",
  "key_matchups": "...",
  "prediction_summary": "..."
}
Do not include any other text or markdown formatting.`;

  // We'll try stable models first as preview ones can have stricter API key/tier requirements
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-3-flash-preview"];
  let lastError = "";
  
  for (const model of models) {
    console.log(`📡 Attempting generation with ${model}...`);
    // Using v1beta for now as search tools are often beta-only
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    // We'll try with search first, but have a fallback if search quota is 0
    const tryRequest = async (useSearch) => {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      };
      if (useSearch) {
        body.tools = [{ googleSearch: {} }];
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${res.status}`;
        return { success: false, status: res.status, message: msg };
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, text };
    };

    try {
      // Attempt 1: With Search
      let result = await tryRequest(true);
      
      // If we got a quota/precondition error, try WITHOUT search as a fallback
      if (!result.success && (result.status === 429 || result.status === 400) && result.message.includes("quota")) {
        console.log(`⚠️ Search quota issue for ${model}, trying without search...`);
        result = await tryRequest(false);
      }

      if (!result.success) {
        console.error(`⚠️ Gemini API error for ${model}: ${result.message}`);
        lastError = `${model}: ${result.message}`;
        // Continue to next model for common retryable errors
        if (result.status === 404 || result.status === 429 || result.status === 400 || result.status === 401) continue;
        return { success: false, error: lastError };
      }

      // Robust JSON extraction from text
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `${model}: Invalid JSON format in response`;
        continue;
      }
      
      const insights = JSON.parse(jsonMatch[0]);
      console.log(`✅ Success with ${model}`);
      return { success: true, insights };
    } catch (err) {
      console.error(`⚠️ Error with ${model}:`, err.message);
      lastError = `${model}: ${err.message}`;
      continue;
    }
  }

  return { success: false, error: lastError || "All models failed" };
}
