// api/generate-match-recap.mjs
// Generates satirical match recap after admin enters results

const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

async function supaFetch(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return res.json();
}

async function supaUpsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=match_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Scoring logic (matches frontend calcPoints)
function calcPoints(sel, res, pScores = {}) {
  if (!sel) return { breakdown: {}, total: 0 };
  const bd = {};
  const getB = (p) => pScores[p]?.batsman_score || 0;
  const getBW = (p) => pScores[p]?.bowler_score || 0;
  const getDB = (p) => pScores[p]?.dot_ball_score || 0;
  const r = res || {};
  const camelize = (s) => s ? s.replace(/\s(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase()) : "";

  bd.winningTeam = sel.winningTeam === r.winningTeam ? 50 + (r.runMargin ? Math.round(r.runMargin) : (r.wicketMargin || 0) * 5) : 0;
  bd.bestBatsman = getB(sel.bestBatsman) + ((r.topScorers || []).includes(sel.bestBatsman) ? 50 : 0);
  bd.bestBowler = getBW(sel.bestBowler) + ((r.bestBowlers || []).includes(sel.bestBowler) ? 50 : 0);
  bd.powerplayWinner = sel.powerplayWinner === r.powerplayWinner ? (r.powerplayScore || 0) + (r.powerplayDiff || 0) : 0;
  bd.dotBallBowler = getDB(sel.dotBallBowler) + ((r.dotBallLeaders || []).includes(sel.dotBallBowler) ? 50 : 0);
  bd.totalWickets = sel.totalWickets === r.wicketsRange ? 100 : 0;
  bd.duckBatsman = (r.duckBatsmen || []).includes(sel.duckBatsman) ? 100 : 0;
  bd.winningHorse = sel.winningHorse && (r.matchTopPlayers || []).length > 0 && (r.matchTopPlayers || []).includes(sel.winningHorse) ? 100 : 0;
  bd.losingHorse = sel.losingHorse && (r.matchBottomPlayers || []).length > 0 && (r.matchBottomPlayers || []).includes(sel.losingHorse) ? 100 : 0;

  if (sel.doubleCategory && bd[camelize(sel.doubleCategory)] !== undefined) {
    const key = camelize(sel.doubleCategory);
    bd[key] = bd[key] * 2;
    bd._doubled = sel.doubleCategory;
  }
  const total = Object.entries(bd).filter(([k]) => !k.startsWith("_")).reduce((s, [, v]) => s + (v || 0), 0);
  return { breakdown: bd, total };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { matchId } = req.body || {};
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  try {
    // Fetch match, result, all selections, player scores
    const [matchArr, resultArr, selArr, pScoresArr] = await Promise.all([
      supaFetch("matches", `select=*&id=eq.${matchId}`),
      supaFetch("results", `select=*&match_id=eq.${matchId}`),
      supaFetch("selections", `select=*&match_id=eq.${matchId}`),
      supaFetch("player_scores", `select=*&match_id=eq.${matchId}`),
    ]);

    const match = matchArr?.[0];
    const result = resultArr?.[0];
    if (!match || !result) return res.status(400).json({ error: "Match or result not found" });

    // Parse result into frontend format
    const parseMulti = (val) => val ? String(val).split(',').map(s => s.trim()) : [];
    const resObj = {
      winningTeam: result.winning_team, runMargin: result.run_margin, wicketMargin: result.wicket_margin,
      topScorers: parseMulti(result.top_scorer), topScorerRuns: result.top_scorer_runs,
      bestBowlers: parseMulti(result.best_bowler), bestBowlerPoints: result.best_bowler_points,
      powerplayWinner: result.powerplay_winner, powerplayScore: result.powerplay_score,
      powerplayDiff: result.powerplay_diff, dotBallLeaders: parseMulti(result.dot_ball_leader),
      dotBalls: result.dot_balls, totalWickets: result.total_wickets, wicketsRange: result.wickets_range,
      duckBatsmen: result.duck_batsmen || [], matchTopPlayers: parseMulti(result.match_top_player),
      matchBottomPlayers: parseMulti(result.match_bottom_player),
    };

    // Build player scores map
    const pScoreMap = {};
    (pScoresArr || []).forEach(s => { pScoreMap[s.player_name] = s; });

    // Calculate points for each fantasy player who submitted
    const playerData = [];
    (selArr || []).forEach(s => {
      const sel = {
        winningTeam: s.winning_team, bestBatsman: s.best_batsman, bestBowler: s.best_bowler,
        powerplayWinner: s.powerplay_winner, dotBallBowler: s.dot_ball_bowler,
        totalWickets: s.total_wickets, duckBatsman: s.duck_batsman,
        doubleCategory: s.double_category, winningHorse: s.winning_horse, losingHorse: s.losing_horse,
      };
      const { breakdown, total } = calcPoints(sel, resObj, pScoreMap);
      
      // Find what they got right and wrong
      const hits = [];
      const misses = [];
      if (breakdown.winningTeam > 0) hits.push(`✅ picked ${sel.winningTeam} to win`);
      else if (sel.winningTeam) misses.push(`❌ picked ${sel.winningTeam} to win (${resObj.winningTeam} won)`);
      if (breakdown.bestBatsman > 0) hits.push(`✅ picked ${sel.bestBatsman} as top bat`);
      else if (sel.bestBatsman) misses.push(`❌ picked ${sel.bestBatsman} as top bat (was ${resObj.topScorers.join("/")})`);
      if (breakdown.bestBowler > 0) hits.push(`✅ picked ${sel.bestBowler} as best bowler`);
      else if (sel.bestBowler) misses.push(`❌ picked ${sel.bestBowler} as best bowler (was ${resObj.bestBowlers.join("/")})`);
      if (breakdown.duckBatsman > 0) hits.push(`✅ predicted ${sel.duckBatsman} duck!`);
      if (breakdown.totalWickets > 0) hits.push(`✅ nailed wicket range ${sel.totalWickets}`);
      else if (sel.totalWickets) misses.push(`❌ wickets: picked ${sel.totalWickets} (was ${resObj.wicketsRange})`);
      if (breakdown.winningHorse > 0) hits.push(`✅ winning horse ${sel.winningHorse}`);
      if (breakdown.losingHorse > 0) hits.push(`✅ losing horse ${sel.losingHorse}`);

      const doubled = sel.doubleCategory || "nothing";

      // Build display name from username
      const displayName = s.username.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      playerData.push({
        username: s.username,
        displayName,
        total,
        breakdown,
        sel,
        hits,
        misses,
        doubled,
      });
    });

    // Sort by points
    playerData.sort((a, b) => b.total - a.total);

    if (playerData.length === 0) {
      return res.status(200).json({ success: true, message: "No submissions for this match" });
    }

    // Build the prompt for Groq
    const mvp = playerData[0];
    const flop = playerData[playerData.length - 1];

    const playerSummaries = playerData.map((p, i) => {
      const rank = i + 1;
      return `${rank}. ${p.displayName} — ${p.total} pts | Doubled: ${p.doubled} | Hits: ${p.hits.join(", ") || "none"} | Misses: ${p.misses.join(", ") || "none"}`;
    }).join("\n");

    const prompt = `You are the MOST SAVAGE fantasy cricket league roast commentator alive. Think of yourself as a mix of:
- A Reddit roast thread moderator with zero chill
- Famous internet memes and pop culture references (e.g., "This is fine" dog, "Task failed successfully", "Tell me you don't watch cricket without telling me", "First time?" meme, "We were on the verge of greatness, we were this close", "Expectation vs Reality", etc.)
- A stand-up comedian doing a brutal friends roast — the kind where everyone is laughing AND crying
- Cricket commentary if it was written by someone who genuinely hates bad predictions

YOUR LANGUAGE: English only. NO Telugu, Hindi, or any regional language. Pure English sarcasm.
YOUR TONE: Maximum sarcasm. Each line should make the group chat explode. Think "why are you booing me, I'm right" energy.

MATCH: M${matchId} - ${match.home} vs ${match.away} (${match.date})
RESULT: ${resObj.winningTeam} won${resObj.runMargin ? ` by ${resObj.runMargin} runs` : resObj.wicketMargin ? ` by ${resObj.wicketMargin} wickets` : ""}
Top Scorer: ${resObj.topScorers.join(", ")} (${resObj.topScorerRuns} runs)
Best Bowler: ${resObj.bestBowlers.join(", ")}
Ducks: ${(resObj.duckBatsmen || []).join(", ") || "None"}

FANTASY PLAYER RESULTS (sorted by points):
${playerSummaries}

MVP: ${mvp.displayName} (${mvp.total} pts)
FLOP: ${flop.displayName} (${flop.total} pts)

GENERATE a JSON response with:
1. "overall_summary": A 3-4 line SAVAGE match summary. Set the scene dramatically, then roast the overall group performance. Use meme references. Example tone: "Another day, another masterclass in how NOT to play fantasy cricket. ${resObj.winningTeam} won and half of you still picked the other team. The audacity. The delusion. The entertainment."
2. "player_roasts": An array of objects, one per fantasy player, each with:
   - "name": player's display name
   - "line": ONE devastating roast line (max 30 words). MUST reference their ACTUAL picks. Use meme formats, pop culture burns, and cricket humor. Make it so specific they can't deny it.
3. "mvp_line": A backhanded celebration. Example: "Finally did something right. Even a broken clock is right twice a day."
4. "flop_line": The ultimate roast for the worst scorer. Make them regret opening the app.

ROAST INSPIRATION (use these formats and adapt):
- "Picked [wrong team] to win. My man brought a plastic chair to a war zone."
- "Doubled [wrong category] — that's not confidence, that's a cry for help."
- "Nailed the duck prediction. Finally found something they're good at — predicting failure."
- "Got [X] points. My WiFi router has better cricket sense."
- "Picked [player] as top scorer. Bro scored 3. The umpire had more impact."
- "[Name]'s picks look like they asked their cat to choose."
- "Wicket range prediction was off by a continent."
- "This performance is the fantasy cricket equivalent of bringing a knife to a gunfight."

CRITICAL RULES:
- ENGLISH ONLY. No Telugu, Hindi, or any other language.
- Reference ACTUAL picks and results — don't make up scenarios
- Each roast MUST be unique and specific to what that person picked
- If someone doubled a wrong category, DESTROY that decision
- If someone nailed the duck prediction, give them chaotic evil credit
- Maximum sarcasm — if it doesn't hurt a little, you're not trying hard enough
- Keep it PG-13 — savage but friendly. Roast the picks, not the person.

Return ONLY valid JSON, no other text.`;


    // Call Groq
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(",")[0] || "";
    if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    let lastError = "";
    let recapData = null;

    for (const model of models) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model, temperature: 0.7, response_format: { type: "json_object" }
          }),
        });
        if (!groqRes.ok) { lastError = `${model}: HTTP ${groqRes.status}`; continue; }
        const data = await groqRes.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) { lastError = `${model}: Empty`; continue; }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { lastError = `${model}: Bad JSON`; continue; }
        recapData = JSON.parse(jsonMatch[0]);
        break;
      } catch (err) { lastError = `${model}: ${err.message}`; continue; }
    }

    if (!recapData) {
      return res.status(500).json({ error: `AI generation failed: ${lastError}` });
    }

    // Save to database
    await supaUpsert("match_recaps", {
      match_id: matchId,
      overall_summary: recapData.overall_summary || "",
      player_roasts: recapData.player_roasts || [],
      mvp_name: mvp.displayName,
      mvp_line: recapData.mvp_line || "",
      flop_name: flop.displayName,
      flop_line: recapData.flop_line || "",
      generated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, recap: recapData });
  } catch (err) {
    console.error("Recap error:", err);
    return res.status(500).json({ error: err.message });
  }
}
