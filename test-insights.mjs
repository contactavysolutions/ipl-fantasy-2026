// Quick test: Generate insights for Match 1 (RCB vs SRH) using Gemini API
// Run: node test-insights.mjs

const GEMINI_API_KEY = "AIzaSyDqpj5PiBFNPPfxF382ZzUmcGxnPrULiSU";
const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

const homeTeam = "RCB";
const awayTeam = "SRH";
const matchDate = "28-Mar-26";
const matchId = 1;

const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: Royal Challengers Bengaluru (RCB) vs Sunrisers Hyderabad (SRH) scheduled on ${matchDate}:

Search for the LATEST cricket news, team announcements, and recent match performances to provide:

1. PROBABLE PLAYING XI for Royal Challengers Bengaluru - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.
2. PROBABLE PLAYING XI for Sunrisers Hyderabad - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.
3. IN-FORM BATSMEN from Royal Challengers Bengaluru - Name 2-3 batsmen in great form. Include their recent IPL 2026 stats (runs, strike rate, recent scores). Be specific with numbers.
4. IN-FORM BATSMEN from Sunrisers Hyderabad - Name 2-3 batsmen in great form. Include their recent IPL 2026 stats.
5. IN-FORM BOWLERS from Royal Challengers Bengaluru - Name 2-3 bowlers in great form. Include their recent IPL 2026 stats (wickets, economy, recent figures).
6. IN-FORM BOWLERS from Sunrisers Hyderabad - Name 2-3 bowlers in great form. Include their recent IPL 2026 stats.
7. PITCH REPORT - Describe the pitch conditions at the venue. Is it batting-friendly, bowling-friendly, or balanced? Average first innings score? Does pace or spin dominate? Dew factor?
8. HEAD TO HEAD - Recent head-to-head record between Royal Challengers Bengaluru and Sunrisers Hyderabad in the last 5 IPL meetings. Who has the edge?
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

async function test() {
  console.log("🔄 Calling Gemini API for RCB vs SRH insights...\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("❌ Gemini API error:", res.status, await res.text());
    return;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("❌ No text in response:", JSON.stringify(data).substring(0, 500));
    return;
  }

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const insights = JSON.parse(cleaned);

  console.log("✅ Gemini returned insights!\n");
  console.log("Home XI:", insights.home_probable_xi?.length, "players");
  console.log("Away XI:", insights.away_probable_xi?.length, "players");
  console.log("Pitch:", insights.pitch_report?.substring(0, 100), "...");
  console.log("Prediction:", insights.prediction_summary?.substring(0, 100), "...\n");

  // Save to Supabase
  console.log("🔄 Saving to Supabase...");
  const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/match_insights?on_conflict=match_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      match_id: matchId,
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
    }),
  });

  console.log("Supabase status:", saveRes.status);
  const result = await saveRes.json();
  console.log("✅ Saved! Result:", JSON.stringify(result).substring(0, 200));
  console.log("\n🎉 Done! Refresh your app at http://localhost:5173, click on Match 1, and you should see the insights panel.");
}

test().catch(e => console.error("Error:", e));
