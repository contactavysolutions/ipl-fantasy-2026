// Batch generate insights for matches 2-7 (up to 4/3/26)
// Uses delays between calls to avoid rate limiting

const GEMINI_API_KEY = "AIzaSyDqpj5PiBFNPPfxF382ZzUmcGxnPrULiSU";
const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

const TEAMS = {
  RCB: "Royal Challengers Bengaluru", MI: "Mumbai Indians", CSK: "Chennai Super Kings",
  KKR: "Kolkata Knight Riders", SRH: "Sunrisers Hyderabad", DC: "Delhi Capitals",
  GT: "Gujarat Titans", RR: "Rajasthan Royals", PBKS: "Punjab Kings", LSG: "Lucknow Super Giants",
};

const matches = [
  { id: 2, home: "MI", away: "KKR", date: "29-Mar-26" },
  { id: 3, home: "RR", away: "CSK", date: "30-Mar-26" },
  { id: 4, home: "PBKS", away: "GT", date: "31-Mar-26" },
  { id: 5, home: "LSG", away: "DC", date: "1-Apr-26" },
  { id: 6, home: "KKR", away: "SRH", date: "2-Apr-26" },
  { id: 7, home: "CSK", away: "PBKS", date: "3-Apr-26" },
];

function buildPrompt(home, away, date) {
  const hf = TEAMS[home], af = TEAMS[away];
  return `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${hf} (${home}) vs ${af} (${away}) scheduled on ${date}:

Search for the LATEST cricket news, team announcements, and recent match performances to provide:

1. PROBABLE PLAYING XI for ${hf} - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.
2. PROBABLE PLAYING XI for ${af} - List exactly 11 players most likely to play based on recent team sheets, injury updates, and squad announcements. Use full player names.
3. IN-FORM BATSMEN from ${hf} - Name 2-3 batsmen in great form with recent IPL 2026 stats.
4. IN-FORM BATSMEN from ${af} - Name 2-3 batsmen in great form with recent IPL 2026 stats.
5. IN-FORM BOWLERS from ${hf} - Name 2-3 bowlers in great form with recent IPL 2026 stats.
6. IN-FORM BOWLERS from ${af} - Name 2-3 bowlers in great form with recent IPL 2026 stats.
7. PITCH REPORT - Pitch conditions at the venue. Batting/bowling friendly? Average first innings score? Pace or spin? Dew factor?
8. HEAD TO HEAD - Recent H2H record (last 5 IPL meetings).
9. KEY MATCHUPS - 2-3 specific player vs player battles to watch.
10. PREDICTION SUMMARY - Brief 2-3 sentence match outlook.

Return as valid JSON with these exact keys:
{
  "home_probable_xi": ["Name 1", ... exactly 11],
  "away_probable_xi": ["Name 1", ... exactly 11],
  "home_form_batsmen": "text",
  "away_form_batsmen": "text",
  "home_form_bowlers": "text",
  "away_form_bowlers": "text",
  "pitch_report": "text",
  "head_to_head": "text",
  "key_matchups": "text",
  "prediction_summary": "text"
}

Only return the JSON object, no additional text.`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateOne(match) {
  const prompt = buildPrompt(match.home, match.away, match.date);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in response");

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function saveToSupabase(matchId, insights) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/match_insights?on_conflict=match_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation",
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
  return res.status;
}

async function main() {
  console.log(`\n🏏 Generating insights for ${matches.length} matches...\n`);
  
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`[${i+1}/${matches.length}] M${m.id}: ${m.home} vs ${m.away} (${m.date})`);
    
    try {
      const insights = await generateOne(m);
      console.log(`  ✅ Gemini returned XI: ${insights.home_probable_xi?.length}/${insights.away_probable_xi?.length} players`);
      
      const status = await saveToSupabase(m.id, insights);
      console.log(`  💾 Saved to Supabase (${status})`);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
    
    // Wait 5 seconds between calls to avoid rate limiting
    if (i < matches.length - 1) {
      console.log(`  ⏳ Waiting 5s before next call...`);
      await sleep(5000);
    }
  }
  
  console.log(`\n🎉 Done! Refresh your app to see insights for all matches.\n`);
}

main();
