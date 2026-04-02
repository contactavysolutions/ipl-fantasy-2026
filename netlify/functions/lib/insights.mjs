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
    console.error("❌ GEMINI_API_KEY environment variable is NOT present in process.env.");
    console.error("   Please ensure your .env file is in the root and has GEMINI_API_KEY=...");
    return null;
  }

  console.log(`📡 GEMINI_API_KEY found (length: ${GEMINI_API_KEY.length})`);

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) scheduled on ${matchDate}:

Provide the following:
1. PROBABLE PLAYING XI for both teams (11 players each).
2. IN-FORM BATSMEN and BOWLERS for both teams (with recent stats).
3. PITCH REPORT and Venue analysis.
4. HEAD TO HEAD summary.
5. KEY MATCHUPS to watch.
6. PREDICTION SUMMARY.

IMPORTANT: Return your response as valid JSON with exactly these keys:
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
Only return the JSON object, no markdown.`;

  // We'll try stable models first as preview ones can have stricter API key/tier requirements
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-3-flash-preview"];
  
  for (const model of models) {
    console.log(`📡 Attempting generation with ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
      // Note: removing tools temporarily to see if it bypasses the 400 error
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`⚠️ Gemini API error for ${model} (${res.status}):`, errText);
        // Continue to next model if it's a 404 or 400 (Bad Request)
        if (res.status === 404 || res.status === 400 || res.status === 401) continue;
        return null;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error(`⚠️ No text in ${model} response.`);
        continue;
      }

      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
      const insights = JSON.parse(cleaned);
      console.log(`✅ Success with ${model}`);
      return insights;
    } catch (err) {
      console.error(`⚠️ Error with ${model}:`, err.message);
      continue;
    }
  }

  console.error("❌ All AI models failed to generate insights.");
  return null;
}
