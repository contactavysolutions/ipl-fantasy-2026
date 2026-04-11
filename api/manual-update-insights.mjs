// Netlify Function: Manual AI Match Insights Update
// Triggered from Admin Panel
import { supabaseQuery, supabaseUpsert, generateInsights } from "./lib/insights.mjs";

export const config = {
  runtime: 'edge',
};

export default async (req) => {
  // Only allow POST requests (though Netlify handles others too)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  console.log("🚀 Manual insights update triggered");

  try {
    // 1. Fetch all matches
    const matches = await supabaseQuery("matches", "select=id,home,away,date,time_label,lock_time&order=id.asc");
    if (!Array.isArray(matches)) {
      return new Response(JSON.stringify({ error: "Failed to fetch matches" }), { status: 500 });
    }

    const now = new Date();
    const upcomingToday = [];

    // Find matches within the next 24 hours that haven't started yet
    for (const match of matches) {
      const lockTime = new Date(match.lock_time);
      const hoursUntilLock = (lockTime - now) / (1000 * 60 * 60);

      // Range: 0 to 48 hours from now
      if (hoursUntilLock > 0 && hoursUntilLock <= 48) {
        upcomingToday.push(match);
      }
    }

    if (upcomingToday.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming matches in the next 24 hours needing updates.", results: [] }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`Processing ${upcomingToday.length} matches...`);
    const results = [];

    // Process each match (limit to 1 per run due to Vercel/Netlify timeout limits on Hobby plans)
    const toProcess = upcomingToday.slice(0, 1);

    for (const match of toProcess) {
      console.log(`Manual generating for M${match.id}: ${match.home} vs ${match.away}`);
      
      try {
        const result = await generateInsights(match.home, match.away, match.date, match.id);
        
        if (!result.success) {
          results.push({ 
            matchId: match.id, 
            teams: `${match.home} vs ${match.away}`, 
            success: false, 
            error: result.error || "AI generation failed" 
          });
          continue;
        }

        const insights = result.insights;

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

        results.push({ matchId: match.id, teams: `${match.home} vs ${match.away}`, success: true });
      } catch (e) {
        results.push({ matchId: match.id, teams: `${match.home} vs ${match.away}`, success: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ 
      processed: results.length, 
      totalFound: upcomingToday.length,
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Manual update error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
