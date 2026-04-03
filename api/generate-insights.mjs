// Netlify Scheduled Function: Generate AI Match Insights
// Schedule: Every hour, checks for upcoming matches needing insights
import { supabaseQuery, supabaseUpsert, generateInsights } from "./lib/insights.mjs";

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
    const results = [];

    for (const { match, reason } of toProcess) {
      console.log(`Generating insights for M${match.id}: ${match.home} vs ${match.away} (${reason})`);

      const insights = await generateInsights(match.home, match.away, match.date, match.id);
      if (!insights) {
        console.error(`Failed to generate insights for M${match.id}`);
        results.push({ matchId: match.id, success: false });
        continue;
      }

      // 4. Upsert into Supabase
      await supabaseUpsert("match_insights", {
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

      console.log(`✅ Saved insights for M${match.id}`);
      results.push({ matchId: match.id, success: true });
    }

    return new Response(JSON.stringify({ processed: toProcess.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Internal error", { status: 500 });
  }
};

// Vercel edge configuration
export const config = {
  runtime: 'edge'
};
