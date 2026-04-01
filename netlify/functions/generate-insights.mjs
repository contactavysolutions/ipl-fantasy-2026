// Netlify Scheduled Function: Generate AI Match Insights
// Schedule: Every hour, checks for upcoming matches needing insights
// Uses Google Gemini API with web search grounding

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

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function supabaseQuery(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return res.json();
}

async function supabaseUpsert(table, data) {
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

// ─── Gemini API ───────────────────────────────────────────────────────────────
async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set");
    return null;
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) scheduled on ${matchDate}:

Search for the LATEST cricket news, team announcements, and recent match performances to provide:

1. PROBABLE PLAYING XI for ${homeFull} - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.

2. PROBABLE PLAYING XI for ${awayFull} - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.

3. IN-FORM BATSMEN from ${homeFull} - Name 2-3 batsmen in great form. Include their recent IPL 2026 stats (runs, strike rate, recent scores). Be specific with numbers.

4. IN-FORM BATSMEN from ${awayFull} - Name 2-3 batsmen in great form. Include their recent IPL 2026 stats.

5. IN-FORM BOWLERS from ${homeFull} - Name 2-3 bowlers in great form. Include their recent IPL 2026 stats (wickets, economy, recent figures).

6. IN-FORM BOWLERS from ${awayFull} - Name 2-3 bowlers in great form. Include their recent IPL 2026 stats.

7. PITCH REPORT - Describe the pitch conditions at the venue. Is it batting-friendly, bowling-friendly, or balanced? Average first innings score? Does pace or spin dominate? Dew factor?

8. HEAD TO HEAD - Recent head-to-head record between ${homeFull} and ${awayFull} in the last 5 IPL meetings. Who has the edge?

9. KEY MATCHUPS - Describe 2-3 specific player vs player battles to watch (e.g., a particular batsman vs a particular bowler). Explain why each matchup matters.

10. PREDICTION SUMMARY - A brief 2-3 sentence overall match outlook. Who has the edge and why?

IMPORTANT: Return your response as valid JSON with exactly these keys:
{
  "home_probable_xi": ["Full Name 1", "Full Name 2", ... exactly 11 names],
  "away_probable_xi": ["Full Name 1", "Full Name 2", ... exactly 11 names],
  "home_form_batsmen": "formatted text with player names and stats",
  "away_form_batsmen": "formatted text with player names and stats",
  "home_form_bowlers": "formatted text with player names and stats",
  "away_form_bowlers": "formatted text with player names and stats",
  "pitch_report": "detailed pitch and venue analysis",
  "head_to_head": "recent H2H summary with results",
  "key_matchups": "2-3 specific player vs player battles",
  "prediction_summary": "brief match outlook and prediction"
}

Only return the JSON object, no additional text or markdown formatting.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
    tools: [{ googleSearch: {} }],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini API error (${res.status}):`, errText.substring(0, 500));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(data).substring(0, 500));
      return null;
    }

    // Parse JSON from the response
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const insights = JSON.parse(cleaned);
    return insights;
  } catch (err) {
    console.error("Error calling Gemini:", err.message);
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async (req) => {
  console.log("⏰ Running insights check at", new Date().toISOString());

  try {
    // 1. Fetch all matches
    const matches = await supabaseQuery("matches", "select=id,home,away,date,time_label,lock_time&order=id.asc");
    if (!Array.isArray(matches)) {
      console.error("Failed to fetch matches:", matches);
      return new Response("Error fetching matches", { status: 500 });
    }

    // 2. Fetch existing insights
    const existingInsights = await supabaseQuery("match_insights", "select=match_id,generated_at");
    const insightsMap = {};
    if (Array.isArray(existingInsights)) {
      existingInsights.forEach((i) => (insightsMap[i.match_id] = i.generated_at));
    }

    const now = new Date();
    const matchesNeedingInsights = [];

    for (const match of matches) {
      const lockTime = new Date(match.lock_time);
      const hoursUntilLock = (lockTime - now) / (1000 * 60 * 60);

      // Skip past matches
      if (hoursUntilLock < 0) continue;

      const hasInsights = insightsMap[match.id];

      // Generate initial insights: 23-25 hours before lock time
      if (hoursUntilLock <= 25 && hoursUntilLock >= 23 && !hasInsights) {
        matchesNeedingInsights.push({ match, reason: "initial (24h before)" });
        continue;
      }

      // Refresh insights: 5-7 hours before lock time, if insights are older than 18h
      if (hoursUntilLock <= 7 && hoursUntilLock >= 5 && hasInsights) {
        const insightAge = (now - new Date(hasInsights)) / (1000 * 60 * 60);
        if (insightAge >= 18) {
          matchesNeedingInsights.push({ match, reason: "refresh (6h before)" });
        }
      }

      // Catch-all: if match is 0-25h away and still has NO insights, generate them
      if (hoursUntilLock <= 25 && hoursUntilLock > 0 && !hasInsights) {
        matchesNeedingInsights.push({ match, reason: "catch-up (no insights yet)" });
      }
    }

    console.log(`Found ${matchesNeedingInsights.length} match(es) needing insights`);

    // 3. Generate insights for each match (limit to 3 per run to avoid timeouts)
    const toProcess = matchesNeedingInsights.slice(0, 3);
    for (const { match, reason } of toProcess) {
      console.log(`Generating insights for M${match.id}: ${match.home} vs ${match.away} (${reason})`);

      const insights = await generateInsights(match.home, match.away, match.date, match.id);
      if (!insights) {
        console.error(`Failed to generate insights for M${match.id}`);
        continue;
      }

      // 4. Upsert into Supabase
      const result = await supabaseUpsert("match_insights", {
        match_id: match.id,
        home_probable_xi: insights.home_probable_xi || [],
        away_probable_xi: insights.away_probable_xi || [],
        home_form_batsmen: insights.home_form_batsmen || "",
        away_form_batsmen: insights.away_form_batsmen || "",
        home_form_bowlers: insights.home_form_bowlers || "",
        away_form_bowlers: insights.away_form_bowlers || "",
        pitch_report: insights.pitch_report || "",
        head_to_head: insights.head_to_head || "",
        key_matchups: insights.key_matchups || "",
        prediction_summary: insights.prediction_summary || "",
        generated_at: new Date().toISOString(),
      });

      console.log(`✅ Saved insights for M${match.id}:`, JSON.stringify(result).substring(0, 200));
    }

    return new Response(`Processed ${toProcess.length} match(es)`, { status: 200 });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Internal error", { status: 500 });
  }
};

// Netlify scheduled function config
export const config = {
  schedule: "0 * * * *", // Every hour
};
