export const config = {
  runtime: 'edge',
};

const TEAM_NAME_MAP = {
  "CSK": "Chennai Super Kings",
  "MI": "Mumbai Indians",
  "RCB": "Royal Challengers Bangalore",
  "KKR": "Kolkata Knight Riders",
  "SRH": "Sunrisers Hyderabad",
  "DC": "Delhi Capitals",
  "RR": "Rajasthan Royals",
  "PBKS": "Punjab Kings",
  "LSG": "Lucknow Super Giants",
  "GT": "Gujarat Titans"
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { matchId, home, away, date, allPlayers } = await req.json();

    if (!process.env.TAVILY_API_KEY || !process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing TAVILY_API_KEY or GROQ_API_KEY in environment variables.' }), { status: 500 });
    }

    const homeFull = TEAM_NAME_MAP[home] || home;
    const awayFull = TEAM_NAME_MAP[away] || away;

    const query = `IPL scorecard match result ${homeFull} vs ${awayFull} ${date} post match cricbuzz espncricinfo`;

    // 1. Tavily Search
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 3
      })
    });

    if (!tavilyRes.ok) {
        let errDetails = await tavilyRes.text();
        return new Response(JSON.stringify({ error: `Tavily API failed: ${errDetails}` }), { status: 500 });
    }

    const tavilyData = await tavilyRes.json();
    const sourcesContext = tavilyData.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join("\n\n");

    // 2. Groq LLM Parse
    const prompt = `
You are a cricket stats expert extracting match results for the IPL Fantasy app.
Extract the match results from the following web search data for the match between ${home} (${homeFull}) and ${away} (${awayFull}) on ${date}.

Web Search Context:
${sourcesContext}
${tavilyData.answer ? `\nOverview Answer: ${tavilyData.answer}` : ''}

You must return ONLY a JSON object evaluating the results.
Adhere EXACTLY to the following schema:
{
  "is_match_completed": boolean (false if the match was abandoned, not yet played, or no definitive final score is found),
  "teams_match": boolean (true if the scorecard you found actually involves ${home} and ${away}),
  "match_date_verification": string (the exact date the match was played according to the scorecard),
  "confidence": number (1-10, how confident are you this is the exact match requested and data is accurate),
  "winningTeam": string (MUST be either "${home}", "${away}", or "Match Tied" / "No Result"),
  "winByRuns": boolean (true if won by runs, false if won by wickets),
  "runMargin": number (the run margin if won by runs, 0 otherwise),
  "wicketMargin": number (the wicket margin if won by wickets, 0 otherwise),
  "topScorers": array of strings (the player(s) who scored the most runs in the ENTIRE match. Choose names exact match from the AllowedPlayers list below if possible. If multiple tied, list all),
  "topScorerRuns": number (how many runs the top scorer hit),
  "bestBowlers": array of strings (the player(s) who took the most wickets in the match. Choose exact match from AllowedPlayers),
  "totalWickets": number (sum of wickets fallen across BOTH innings),
  "powerplayWinner": string ("${home}", "${away}", or "Tied". The team with higher score in the first 6 overs),
  "powerplayScore": number (the higher powerplay score),
  "powerplayDiff": number (difference between the two powerplay scores)
}

AllowedPlayers (try to map the names found to these EXACT strings):
${allPlayers.join(", ")}

If you cannot find a piece of information, you can leave numbers as 0 or array as empty. 
Respond ONLY with raw JSON. No markdown backticks, no explanations.
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
        let errDetails = await groqRes.text();
        return new Response(JSON.stringify({ error: `Groq API failed: ${errDetails}` }), { status: 500 });
    }

    const groqData = await groqRes.json();
    let resultJson = {};
    try {
      resultJson = JSON.parse(groqData.choices[0].message.content.trim());
    } catch (e) {
      return new Response(JSON.stringify({ error: `Failed to parse Groq response as JSON. Response: ${groqData.choices[0].message.content}` }), { status: 500 });
    }

    // 3. Validation Logic Server-side
    if (!resultJson.is_match_completed) {
      return new Response(JSON.stringify({ error: "AI determined the match data is not completed/available yet." }), { status: 400 });
    }
    if (!resultJson.teams_match) {
      return new Response(JSON.stringify({ error: "AI found a scorecard, but it was for different teams." }), { status: 400 });
    }
    if (resultJson.confidence < 7) {
      return new Response(JSON.stringify({ error: `AI confidence too low (${resultJson.confidence}/10) to reliably autofill.` }), { status: 400 });
    }

    // Map wickets to range brackets
    let wicketsRange = "";
    if (resultJson.totalWickets) {
      const w = resultJson.totalWickets;
      if (w < 12) wicketsRange = "<12";
      else if (w <= 14) wicketsRange = "12-14";
      else wicketsRange = "15+";
    }

    resultJson.wicketsRange = wicketsRange;

    return new Response(JSON.stringify({ success: true, matchId, data: resultJson }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
