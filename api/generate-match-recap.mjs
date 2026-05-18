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

    // ── Rotating roast personas — one picked randomly per generation ─────────────
    const PERSONAS = [
      { name: "Nature Documentary Narrator", style: "Narrate every bad pick like David Attenborough discovering a new species of idiot. 'And here... we observe the fantasy player... making the same mistake for the third consecutive match. Remarkable.'" },
      { name: "Disappointed Corporate Manager", style: "Passive-aggressive performance review energy. 'Per my last email, this pick was suboptimal.' 'Going forward, I'd encourage more due diligence.' 'This is a growth opportunity we clearly did not take.'" },
      { name: "Gordon Ramsay", style: "Absolute kitchen nightmare energy. 'This pick is so raw it's still mooing.' 'You call that a double category? My nan picks better and she thinks IPL is a vitamin supplement.' DONKEY." },
      { name: "Disappointed Indian Parent", style: "Every bad pick is compared to someone who did better. 'Sharma ji's son got 200 more points and he doesn't even watch cricket.' Loving but devastatingly high-expectation energy." },
      { name: "LinkedIn Thought Leader", style: "Humblebrag meets disaster. 'Really humbled by this learning experience. Picked the wrong team — but failure is just success in disguise. Grateful. #Fantasy #Cricket #GrowthMindset #Blessed #Wrong'" },
      { name: "Medieval Town Crier", style: "Announce picks like a medieval herald. 'HEAR YE! The noble [Name] hath chosen foolishly and suffered GRIEVOUS losses! The kingdom is disappointed! The tavern laughs!'" },
      { name: "Breaking News Anchor", style: "BREAKING: Local fantasy player makes inexplicable pick for 4th straight match. Sources close to the situation describe it as 'baffling'. Panel of experts unable to explain the logic. More at 11." },
      { name: "Overly Positive Life Coach", style: "Ironically positive spin on disasters. 'You didn't get points — you got perspective! The universe is redirecting you! The wrong pick was the pick you needed to grow!' (It wasn't.)" },
      { name: "r/mildlyinfuriating Moderator", style: "Deadpan understated rage. 'Ah yes, picking [wrong team] to win. Totally normal. Perfectly reasonable. I'm not upset. This is fine. Everything is fine. I'm fine.' [visible frustration]" },
      { name: "Overly Dramatic Sports Commentator", style: "Treat every bad pick like a national crisis. 'In forty years of commentary, I have NEVER witnessed a double category decision so catastrophically, historically, cosmically wrong. History will judge this.'" },
    ];

    // ── Massive roast template pool — 10 random ones injected per generation ─────
    const ALL_TEMPLATES = [
      "Picked [wrong team] to win. My man brought a plastic chair to a war zone.",
      "Backed [wrong team]. The audacity. The delusion. The entertainment value. Carry on.",
      "The [wrong team] pick aged like milk in a Chennai afternoon.",
      "Trusted [player] as top scorer. [Player] then scored less than the drinks break.",
      "Picked [player] as best bat. [Player] said no, actually, and made 4.",
      "The [player] pick looked great on paper. The paper was factually incorrect.",
      "Doubled [wrong category]. Twice the investment. Twice the disappointment. Efficient.",
      "The double on [wrong category] was brave in the way that touching a hot stove is brave.",
      "Doubled [wrong category] — not confidence, that's a cry for help with extra steps.",
      "Got [X] points. My houseplant has stronger cricket instincts and it's been dead for a month.",
      "[X] points. That's not a score, that's a rounding error.",
      "Managed [X] points — proof that picking at random is also a strategy, just a bad one.",
      "Trusted [player] with the ball. [Player] had other plans, specifically: conceding runs.",
      "[Player] as best bowler. Bold. Wrong. Expensive.",
      "Predicted the duck on [player]. Dark arts. Chaos mastery. Deeply unsettling. Respect.",
      "Called [player] for a duck. They got a duck. This person sees the future and uses it poorly.",
      "Wicket range was off by a country mile. And then another country.",
      "Picked [wrong range] wickets. The actual number laughed and went elsewhere.",
      "The picks read like they were generated by an AI that hates you specifically.",
      "Every pick was made with the confidence of someone who definitely watches cricket. They don't.",
      "This is fine. (Everything is not fine.)",
      "Task: Pick good fantasy team. Status: Failed successfully.",
      "Tell me you don't watch cricket without telling me you don't watch cricket.",
      "POV: You've played fantasy cricket for 3 months and learned absolutely nothing.",
      "Nobody: ... Absolutely nobody: ... [Name]: doubles [terrible category].",
      "The [player] pick was very much a 'we have top scorer at home' situation.",
      "Plot twist: [Name] was playing for the other team's fantasy league.",
      "When you study for the wrong exam, take it anyway, and fail. This is that.",
      "Started strong. Picked the right sport. Went downhill from there.",
      "One correct pick. One. Out of many. Frame it. Put it on the wall.",
      "Somehow wrong about everything simultaneously. That's statistically impressive.",
      "At this point I'm convinced this is performance art.",
      "The picks were bold. The results were not. A familiar story.",
      "Confidently incorrect. A rare skill. Not everyone can do it this consistently.",
      "The group chat has seen this pick sheet. The group chat has opinions.",
      "I'm not saying it was a bad pick, but the ball has more self-awareness.",
      "Picks locked in with zero doubt. Zero doubt. Zero points. Symmetry.",
      "Current strategy: pick wrong, reflect, pick wrong again. A cycle. A brand.",
      "These picks walked so future bad picks could run.",
      "Somewhere, the correct picks are out there. Not here, but somewhere.",
      "The wrong team, the wrong batsman, the wrong bowler. A clean sweep of incorrectness.",
      "An ambitious pick sheet, in the sense that it ambitiously avoided being right.",
      "This pick aged like milk, expired milk, milk that didn't even try.",
      "The algorithm, the gut, the vibes — all said wrong team. And yet.",
      "I've seen better picks from someone who chose based on jersey color.",
      "Backed the wrong horse, wrong bat, wrong bowl. A masterpiece of incorrectness.",
      "Instructions unclear. Picked [wrong player] anyway.",
      "The double was the only way to make a bad pick twice as bad. Mission accomplished.",
      "Sir, this is a cricket fantasy league, not an experiment in chaos theory.",
      "I'm not angry. I'm just deeply, profoundly confused by these picks.",
      "The duck prediction was the only thing that worked. The duck sees all.",
      "Picked [player] knowing full well [player] had been averaging 4 runs. Loyalty or delusion?",
      "Sometimes you back the wrong team. This person does it consistently. Respect the commitment.",
      "A pick sheet so wrong it's almost impressive. Almost.",
    ];

    // Pick a random persona and 10 random templates for this generation
    const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
    const shuffledTemplates = [...ALL_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 10);

    const prompt = `You are the MOST SAVAGE fantasy cricket league roast commentator. Today's assigned persona:

🎭 PERSONA: ${persona.name}
STYLE: ${persona.style}

Also blend in: internet meme energy, pop culture references, cricket banter.
LANGUAGE: ENGLISH ONLY. No Telugu, Hindi, or any other language. Ever.
DIVERSITY RULE: Every single roast line MUST use a completely different format, structure, and comedic device. If one roast is a nature doc, the next is a LinkedIn post, the next is breaking news — zero repetition of style within the same recap.

MATCH: M${matchId} - ${match.home} vs ${match.away} (${match.date})
RESULT: ${resObj.winningTeam} won${resObj.runMargin ? ` by ${resObj.runMargin} runs` : resObj.wicketMargin ? ` by ${resObj.wicketMargin} wickets` : ""}
Top Scorer: ${resObj.topScorers.join(", ")} (${resObj.topScorerRuns} runs)
Best Bowler: ${resObj.bestBowlers.join(", ")}
Ducks: ${(resObj.duckBatsmen || []).join(", ") || "None"}

FANTASY PLAYER RESULTS (sorted by points):
${playerSummaries}

MVP: ${mvp.displayName} (${mvp.total} pts)
FLOP: ${flop.displayName} (${flop.total} pts)

ROAST TEMPLATE INSPIRATION — adapt freely, never copy verbatim, each should spark a completely original line:
${shuffledTemplates.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

GENERATE JSON:
1. "overall_summary": 3-4 lines in the ${persona.name} voice. Set the dramatic scene, reference the actual result, roast the group's collective performance. Make it quotable enough to screenshot.
2. "player_roasts": Array — one object per player:
   - "name": player display name
   - "line": ONE roast (max 30 words). SPECIFIC to their actual picks (what they got right/wrong). EVERY line in this array must have a structurally DIFFERENT format — no two roasts can sound the same.
3. "mvp_line": Backhanded compliment in the ${persona.name} style. Reference their actual good pick.
4. "flop_line": Make it legendary. Reference their worst pick specifically. ${flop.displayName} should feel this.

NON-NEGOTIABLE RULES:
- ENGLISH ONLY — zero exceptions
- Never repeat a roast structure across players in the same recap
- Always reference actual picks — wrong team, wrong player, bad double
- Double wrong category = nuclear roast
- Duck correct = chaotic evil respect
- PG-13. Roast the picks, not the person.

Return ONLY valid JSON. No other text.`;

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
            model, temperature: 0.92, response_format: { type: "json_object" }
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
