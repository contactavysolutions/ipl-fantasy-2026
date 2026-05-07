// api/lib/insights.mjs
// 3-Layer AI Insights: DB Form Data + Tavily Web Search + Groq LLM Structuring

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

// ─── AUTHORITATIVE IPL 2026 SQUADS ───────────────────────────────────────────
// These are the ONLY valid player names. Injected into the AI prompt to prevent hallucination.
const SQUADS_2026 = {
  CSK: ["Ruturaj Gaikwad","MS Dhoni","Sanju Samson","Kartik Sharma","Urvil Patel","Dewald Brevis","Ayush Mhatre","Sarfaraz Khan","Shivam Dube","Matthew Short","Jamie Overton","Ramakrishna Ghosh","Anshul Kamboj","Prashant Veer","Aman Khan","Zak Foulkes","Khaleel Ahmed","Mukesh Choudhary","Gurjapneet Singh","Matt Henry","Spencer Johnson","Shreyas Gopal","Rahul Chahar","Noor Ahmad","Akeal Hosein"],
  DC:  ["Axar Patel","KL Rahul","Prithvi Shaw","David Miller","Tristan Stubbs","Abhishek Porel","Karun Nair","Sameer Rizvi","Ashutosh Sharma","Mitchell Starc","T. Natarajan","Mukesh Kumar","Dushmantha Chameera","Lungi Ngidi","Kyle Jamieson","Nitish Rana","Kuldeep Yadav","Ajay Mandal","Tripurana Vijay","Madhav Tiwari","Pathum Nissanka","Sahil Parakh","Vipraj Nigam","Ben Duckett","Auqib Nabi"],
  GT:  ["Shubman Gill","Jos Buttler","Sai Sudharsan","Shahrukh Khan","Anuj Rawat","Kumar Kushagra","Nishant Sindhu","Rahul Tewatia","Washington Sundar","Rashid Khan","Jason Holder","Kagiso Rabada","Mohammed Siraj","Prasidh Krishna","Ishant Sharma","Sai Kishore","Jayant Yadav","Manav Suthar","Arshad Khan","Gurnoor Singh Brar","Kulwant Khejroliya","Glenn Phillips","Tom Banton","Luke Wood","Ashok Sharma"],
  KKR: ["Ajinkya Rahane","Cameron Green","Rinku Singh","Sunil Narine","Varun Chakravarthy","Navdeep Saini","Saurabh Dubey","Blessing Muzarabani","Angkrish Raghuvanshi","Vaibhav Arora","Matheesha Pathirana","Umran Malik","Manish Pandey","Rovman Powell","Finn Allen","Rachin Ravindra","Daksh Kamra","Tim Seifert","Kartik Tyagi","Prashant Solanki","Anukul Roy","Rahul Tripathi","Ramandeep Singh","Sarthak Ranjan","Tejasvi Singh"],
  LSG: ["Rishabh Pant","Nicholas Pooran","Ayush Badoni","Mohammed Shami","Avesh Khan","Mohsin Khan","Arshin Kulkarni","Shahbaz Ahmed","Aiden Markram","Abdul Samad","Wanindu Hasaranga","Himmat Singh","Akshat Raghuwanshi","Mitchell Marsh","Arjun Tendulkar","Matthew Breetzke","Josh Inglis","Mukul Choudhary","Akash Maharaj Singh","Anrich Nortje","Prince Yadav","Digvesh Singh Rathi","Mayank Yadav","Naman Tiwari","Manimaran Siddharth"],
  MI:  ["Hardik Pandya","Rohit Sharma","Suryakumar Yadav","Tilak Varma","Quinton de Kock","Ryan Rickelton","Naman Dhir","Danish Malewar","Sherfane Rutherford","Will Jacks","Mitchell Santner","Shardul Thakur","Raj Bawa","Corbin Bosch","Jasprit Bumrah","Trent Boult","Deepak Chahar","Mayank Markande","Atharva Ankolekar","AM Ghazanfar","Mayank Rawat","Mohammad Izhar","Raghu Sharma","Robin Minz","Ashwani Kumar"],
  PBKS:["Marcus Stoinis","Shreyas Iyer","Prabhsimran Singh","Arshdeep Singh","Harpreet Brar","Shashank Singh","Yuzvendra Chahal","Marco Jansen","Priyansh Arya","Pyla Avinash","Nehal Wadhera","Harnoor Singh","Mitchell Owen","Musheer Khan","Suryansh Shedge","Cooper Connolly","Azmatullah Omarzai","Praveen Dubey","Vishnu Vinod","Lockie Ferguson","Xavier Bartlett","Ben Dwarshuis","Vishal Nishad","Vijaykumar Vyshak","Yash Thakur"],
  RCB: ["Rajat Patidar","Virat Kohli","Devdutt Padikkal","Tim David","Phil Salt","Jitesh Sharma","Jordan Cox","Jacob Bethell","Venkatesh Iyer","Krunal Pandya","Romario Shepherd","Swapnil Singh","Bhuvneshwar Kumar","Rasikh Salam","Suyash Sharma","Vicky Ostwal","Jacob Duffy","Nuwan Thushara","Abhinandan Singh","Mangesh Yadav","Kanishk Chouhan","Vihaan Malhotra","Satvik Deswal","Josh Hazlewood","Yash Dayal"],
  RR:  ["Riyan Parag","Yashasvi Jaiswal","Dhruv Jurel","Shimron Hetmyer","Shubham Dubey","Ravindra Jadeja","Dasun Shanaka","Kuldeep Sen","Nandre Burger","Donovan Ferreira","Aman Rao Perala","Vaibhav Suryavanshi","Ravi Singh","Lhuan-dre Pretorius","Jofra Archer","Tushar Deshpande","Kwena Maphaka","Sandeep Sharma","Vignesh Puthur","Brijesh Sharma","Sushant Mishra","Yash Raj Punja","Adam Milne","Ravi Bishnoi","Yudhvir Singh Charak"],
  SRH: ["Liam Livingstone","Harshal Patel","Pat Cummins","Ishan Kishan","Travis Head","Heinrich Klaasen","Abhishek Sharma","Nitish Kumar Reddy","Jaydev Unadkat","David Payne","Aniket Verma","Smaran Ravichandran","Kamindu Mendis","Harsh Dubey","Shivang Kumar","Salil Arora","Brydon Carse","Eshan Malinga","Zeeshan Ansari","Sakib Hussain","Onkar Tarmale","Amit Kumar","Praful Hinge","Shivam Mavi","Krains Fuletra"],
};

// ─── Supabase Helpers ────────────────────────────────────────────────────────

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

// ─── LAYER 1: Fetch real form data from our own database ─────────────────────

async function fetchTeamFormFromDB(teamCode) {
  try {
    // Get all results and matches
    const [allResults, allMatches] = await Promise.all([
      supabaseQuery("results", "select=match_id,winning_team,top_scorer,best_bowler,top_scorer_runs,total_wickets,run_margin,wicket_margin,win_by_runs&order=match_id.desc"),
      supabaseQuery("matches", "select=id,home,away,date&order=id.desc")
    ]);

    if (!Array.isArray(allResults) || !Array.isArray(allMatches)) return "";

    const matchMap = {};
    allMatches.forEach(m => { matchMap[m.id] = m; });

    // Filter for this team's matches
    const teamResults = allResults.filter(r => {
      const m = matchMap[r.match_id];
      return m && (m.home === teamCode || m.away === teamCode);
    }).slice(0, 5);

    if (teamResults.length === 0) return "No recent match data available.";

    return teamResults.map(r => {
      const m = matchMap[r.match_id];
      const opponent = m.home === teamCode ? m.away : m.home;
      const won = r.winning_team === teamCode;
      const margin = r.win_by_runs ? `${r.run_margin || '?'} runs` : `${r.wicket_margin || '?'} wickets`;
      return `M${r.match_id} (${m.date}): ${won ? 'WON' : 'LOST'} vs ${opponent} by ${margin} | Top Scorer: ${r.top_scorer || 'N/A'}${r.top_scorer_runs ? ` (${r.top_scorer_runs} runs)` : ''} | Best Bowler: ${r.best_bowler || 'N/A'} | Wickets in match: ${r.total_wickets || 'N/A'}`;
    }).join("\n");
  } catch (e) {
    console.log(`⚠️ Error fetching ${teamCode} form from DB:`, e.message);
    return "";
  }
}

async function fetchH2HFromDB(team1, team2) {
  try {
    const [allResults, allMatches] = await Promise.all([
      supabaseQuery("results", "select=match_id,winning_team,top_scorer,best_bowler&order=match_id.desc"),
      supabaseQuery("matches", "select=id,home,away,date&order=id.desc")
    ]);

    if (!Array.isArray(allResults) || !Array.isArray(allMatches)) return "";

    const matchMap = {};
    allMatches.forEach(m => { matchMap[m.id] = m; });

    const h2h = allResults.filter(r => {
      const m = matchMap[r.match_id];
      return m && ((m.home === team1 && m.away === team2) || (m.home === team2 && m.away === team1));
    });

    if (h2h.length === 0) return "No head-to-head matches this season yet.";

    return h2h.map(r => {
      const m = matchMap[r.match_id];
      return `M${r.match_id} (${m.date}): ${m.home} vs ${m.away} — Winner: ${r.winning_team}, Top Scorer: ${r.top_scorer || 'N/A'}, Best Bowler: ${r.best_bowler || 'N/A'}`;
    }).join("\n");
  } catch (e) {
    console.log(`⚠️ Error fetching H2H from DB:`, e.message);
    return "";
  }
}

// ─── LAYER 2: Tavily web search for real-time context ────────────────────────

async function tavilySearch(query, tavilyKey) {
  if (!tavilyKey) return "";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tavilyKey}` },
      body: JSON.stringify({
        query,
        topic: "news",
        search_depth: "basic",
        max_results: 3,
        time_range: "week",
        include_answer: true,
        include_raw_content: false,
        country: "india",
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`⚠️ Tavily error: ${err?.detail || res.status}`);
      return "";
    }
    const data = await res.json();
    const answer = data.answer || "";
    const snippets = (data.results || []).map(r => `[${r.title}] ${r.content}`).join("\n");
    return [answer, snippets].filter(Boolean).join("\n\n");
  } catch (e) {
    console.log(`⚠️ Tavily search failed: ${e.message}`);
    return "";
  }
}

async function fetchWebContext(homeTeam, awayTeam, homeFull, awayFull, tavilyKey) {
  if (!tavilyKey) {
    console.log("⚠️ TAVILY_API_KEY not set — skipping web search");
    return { homeNews: "", awayNews: "", pitchNews: "" };
  }

  console.log(`🔍 Tavily: fetching live context for ${homeTeam} vs ${awayTeam}...`);

  const [homeNews, awayNews, pitchNews] = await Promise.all([
    tavilySearch(`${homeFull} IPL 2026 recent form playing XI team news injury updates`, tavilyKey),
    tavilySearch(`${awayFull} IPL 2026 recent form playing XI team news injury updates`, tavilyKey),
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 pitch report venue conditions`, tavilyKey),
  ]);

  console.log(`📰 Tavily returned: home=${homeNews.length}c, away=${awayNews.length}c, pitch=${pitchNews.length}c`);
  return { homeNews, awayNews, pitchNews };
}

// ─── LAYER 3: Groq LLM to structure all data into insights ──────────────────

export async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  const keysInput = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  const apiKeys = keysInput.split(',').map(k => k.trim()).filter(Boolean);
  const tavilyKey = process.env.TAVILY_API_KEY || "";

  if (!apiKeys.length) {
    return { success: false, error: "GROQ_API_KEYS missing" };
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  // ── Layer 1: Fetch real form data from our database ──
  console.log(`📊 Fetching real form data from DB for ${homeTeam} & ${awayTeam}...`);
  let homeForm = "", awayForm = "", h2hData = "";
  try {
    [homeForm, awayForm, h2hData] = await Promise.all([
      fetchTeamFormFromDB(homeTeam),
      fetchTeamFormFromDB(awayTeam),
      fetchH2HFromDB(homeTeam, awayTeam)
    ]);
  } catch (e) {
    console.log("⚠️ DB fetch failed, continuing with web data only:", e.message);
  }

  // ── Layer 2: Fetch live web context via Tavily ──
  let webContext = { homeNews: "", awayNews: "", pitchNews: "" };
  try {
    webContext = await fetchWebContext(homeTeam, awayTeam, homeFull, awayFull, tavilyKey);
  } catch (e) {
    console.log("⚠️ Tavily fetch failed, continuing with DB data only:", e.message);
  }

  // ── Layer 3: Build prompt and call Groq ──
  const homeSquad = SQUADS_2026[homeTeam] || [];
  const awaySquad = SQUADS_2026[awayTeam] || [];

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

Match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) on ${matchDate}, IPL 2026.

═══════════════════════════════════════════════════════════
VERIFIED FACTS FROM OUR DATABASE (USE THESE AS GROUND TRUTH):
═══════════════════════════════════════════════════════════

${homeTeam} LAST 5 MATCH RESULTS:
${homeForm || "No data available yet."}

${awayTeam} LAST 5 MATCH RESULTS:
${awayForm || "No data available yet."}

HEAD-TO-HEAD THIS SEASON:
${h2hData || "No head-to-head matches this season yet."}

═══════════════════════════════════════════════════════════
OFFICIAL IPL 2026 SQUADS (ONLY use players from these lists):
═══════════════════════════════════════════════════════════

${homeTeam} Squad: ${homeSquad.join(", ")}
${awayTeam} Squad: ${awaySquad.join(", ")}

═══════════════════════════════════════════════════════════
LATEST NEWS FROM THE WEB:
═══════════════════════════════════════════════════════════

${homeTeam} News:
${(webContext.homeNews || "").substring(0, 1500) || "No recent news found."}

${awayTeam} News:
${(webContext.awayNews || "").substring(0, 1500) || "No recent news found."}

Pitch & Venue:
${(webContext.pitchNews || "").substring(0, 1000) || "No pitch report found."}

═══════════════════════════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════════════════════════

Using the VERIFIED FACTS above as your primary source and the web news as supplementary context:

1. PROBABLE PLAYING XI: Pick exactly 11 players for each team ONLY from the squad lists above. Consider recent form from the database results and any team news from the web. Any name not in the squad list is WRONG.
2. IN-FORM BATSMEN: Base this on the ACTUAL top scorers from the database results above. Reference the specific matches and runs scored. Do NOT make up statistics.
3. IN-FORM BOWLERS: Base this on the ACTUAL best bowlers from the database results above. Reference specific performances. Do NOT make up statistics.
4. PITCH REPORT: Use web news data if available, otherwise give a general analysis based on the venue.
5. HEAD TO HEAD: Use the database H2H data above. Do NOT invent past results that are not in the data.
6. KEY MATCHUPS: Based on the actual in-form players identified from the database.
7. PREDICTION: Based on recent form from database + web context.

Return ONLY a valid JSON object with exactly these keys:
{
  "home_probable_xi": ["Full Name 1", ...11 names],
  "away_probable_xi": ["Full Name 1", ...11 names],
  "home_form_batsmen": "2-3 sentences referencing actual recent performances from the database",
  "away_form_batsmen": "2-3 sentences referencing actual recent performances from the database",
  "home_form_bowlers": "2-3 sentences referencing actual recent performances from the database",
  "away_form_bowlers": "2-3 sentences referencing actual recent performances from the database",
  "pitch_report": "2-3 sentences about pitch and venue conditions",
  "head_to_head": "Summary of this season's encounters between these teams",
  "key_matchups": "3-4 specific player vs player matchups to watch",
  "prediction_summary": "2-3 sentences with prediction and reasoning"
}
Do not include any other text or markdown formatting.`;

  // Call Groq with fallback models
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ];

  let lastError = "";

  for (const apiKey of apiKeys) {
    for (const model of models) {
      console.log(`📡 Generating with Groq model ${model}...`);

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: model,
            temperature: 0.4,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData?.error?.message || `HTTP ${res.status}`;
          console.error(`⚠️ Groq API error for ${model}: ${msg}`);
          lastError = `${model}: ${msg}`;
          continue;
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
          lastError = `${model}: Empty response from API`;
          continue;
        }

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastError = `${model}: Invalid JSON format in response`;
          continue;
        }

        const insights = JSON.parse(jsonMatch[0]);
        console.log(`✅ Success with Groq ${model}`);
        return { success: true, insights };
      } catch (err) {
        console.error(`⚠️ Error with Groq ${model}:`, err.message);
        lastError = `${model}: ${err.message}`;
        continue;
      }
    }
  }

  console.log(`❌ All keys and models failed. Supplying fallback insight structure.`);
  return {
    success: false,
    error: lastError || "All keys and models failed",
    insights: {
      home_probable_xi: ["TBA"],
      away_probable_xi: ["TBA"],
      home_form_batsmen: "Pending",
      away_form_batsmen: "Pending",
      home_form_bowlers: "Pending",
      away_form_bowlers: "Pending",
      pitch_report: "Historical data analysis pending. AI API quota limit reached. Check back later.",
      head_to_head: "Data not pulled.",
      key_matchups: "AI Service momentarily offline.",
      prediction_summary: `Fallback invoked. Error trace: ${lastError || 'Unknown Error'}`
    }
  };
}
