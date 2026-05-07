// api/lib/insights.mjs
// Tavily-Primary AI Insights: Web Search (primary) + DB Win/Loss (supplementary) + Groq LLM

const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

const TEAMS = {
  RCB: "Royal Challengers Bengaluru", MI: "Mumbai Indians", CSK: "Chennai Super Kings",
  KKR: "Kolkata Knight Riders", SRH: "Sunrisers Hyderabad", DC: "Delhi Capitals",
  GT: "Gujarat Titans", RR: "Rajasthan Royals", PBKS: "Punjab Kings", LSG: "Lucknow Super Giants",
};

// ─── AUTHORITATIVE IPL 2026 SQUADS ───────────────────────────────────────────
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
      apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── DB: Only for basic win/loss records (supplementary) ─────────────────────

async function fetchWinLossFromDB(teamCode) {
  try {
    const [results, matches] = await Promise.all([
      supabaseQuery("results", "select=match_id,winning_team&order=match_id.desc"),
      supabaseQuery("matches", "select=id,home,away,date&order=id.desc")
    ]);
    if (!Array.isArray(results) || !Array.isArray(matches)) return "";
    const mm = {};
    matches.forEach(m => { mm[m.id] = m; });
    const team = results.filter(r => { const m = mm[r.match_id]; return m && (m.home === teamCode || m.away === teamCode); }).slice(0, 5);
    if (!team.length) return "No results yet.";
    const wins = team.filter(r => r.winning_team === teamCode).length;
    const summary = team.map(r => { const m = mm[r.match_id]; const opp = m.home === teamCode ? m.away : m.home; return `${r.winning_team === teamCode ? 'W' : 'L'} vs ${opp} (${m.date})`; }).join(", ");
    return `${wins}W-${team.length - wins}L in last ${team.length}: ${summary}`;
  } catch { return ""; }
}

async function fetchH2HFromDB(t1, t2) {
  try {
    const [results, matches] = await Promise.all([
      supabaseQuery("results", "select=match_id,winning_team&order=match_id.desc"),
      supabaseQuery("matches", "select=id,home,away,date&order=id.desc")
    ]);
    if (!Array.isArray(results) || !Array.isArray(matches)) return "";
    const mm = {};
    matches.forEach(m => { mm[m.id] = m; });
    const h2h = results.filter(r => { const m = mm[r.match_id]; return m && ((m.home === t1 && m.away === t2) || (m.home === t2 && m.away === t1)); });
    if (!h2h.length) return "No H2H matches this season.";
    return h2h.map(r => { const m = mm[r.match_id]; return `${m.date}: ${m.home} vs ${m.away} - Winner: ${r.winning_team}`; }).join("; ");
  } catch { return ""; }
}

// ─── Tavily: PRIMARY source for all player stats & news ──────────────────────

async function tavilySearch(query, tavilyKey) {
  if (!tavilyKey) return "";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tavilyKey}` },
      body: JSON.stringify({ query, topic: "news", search_depth: "basic", max_results: 5, time_range: "week", include_answer: true, include_raw_content: false, country: "india" }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return "";
    const data = await res.json();
    const answer = data.answer || "";
    const snippets = (data.results || []).map(r => `[${r.title}] ${r.content}`).join("\n");
    return [answer, snippets].filter(Boolean).join("\n\n");
  } catch { return ""; }
}

// ─── Main: Generate Insights ─────────────────────────────────────────────────

export async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  const keysInput = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  const apiKeys = keysInput.split(',').map(k => k.trim()).filter(Boolean);
  const tavilyKey = process.env.TAVILY_API_KEY || "";

  if (!apiKeys.length) {
    return { success: false, error: "GROQ_API_KEYS missing" };
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  // ── Tavily: 5 targeted web searches (PRIMARY source) ──
  console.log(`🔍 Tavily: searching for ${homeTeam} vs ${awayTeam}...`);
  const [homeForm, awayForm, pitchData, matchPreview, h2hWeb] = await Promise.all([
    tavilySearch(`${homeFull} IPL 2026 last 5 matches results scorecard top performers batsmen bowlers`, tavilyKey),
    tavilySearch(`${awayFull} IPL 2026 last 5 matches results scorecard top performers batsmen bowlers`, tavilyKey),
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 pitch report venue conditions weather`, tavilyKey),
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 match preview probable playing XI team news injuries`, tavilyKey),
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 head to head record stats`, tavilyKey),
  ]);
  console.log(`📰 Tavily: home=${homeForm.length}c away=${awayForm.length}c pitch=${pitchData.length}c preview=${matchPreview.length}c h2h=${h2hWeb.length}c`);

  // ── DB: basic win/loss records (supplementary) ──
  const [homeWL, awayWL, h2hDB] = await Promise.all([
    fetchWinLossFromDB(homeTeam), fetchWinLossFromDB(awayTeam), fetchH2HFromDB(homeTeam, awayTeam)
  ]);

  const homeSquad = SQUADS_2026[homeTeam] || [];
  const awaySquad = SQUADS_2026[awayTeam] || [];

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

Match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) on ${matchDate}, IPL 2026.

OFFICIAL IPL 2026 SQUADS (ONLY use players from these lists for Probable XI):
${homeTeam}: ${homeSquad.join(", ")}
${awayTeam}: ${awaySquad.join(", ")}

WIN/LOSS RECORD FROM DATABASE:
${homeTeam}: ${homeWL || "N/A"}
${awayTeam}: ${awayWL || "N/A"}
H2H this season: ${h2hDB || "N/A"}

RECENT PERFORMANCE DATA FROM WEB (PRIMARY SOURCE):

${homeTeam} Recent Form & Scorecards:
${homeForm.substring(0, 2000) || "No data found."}

${awayTeam} Recent Form & Scorecards:
${awayForm.substring(0, 2000) || "No data found."}

Match Preview & Team News:
${matchPreview.substring(0, 1500) || "No preview found."}

Pitch Report & Venue:
${pitchData.substring(0, 1000) || "No pitch data found."}

Head-to-Head from Web:
${h2hWeb.substring(0, 800) || "No H2H data found."}

INSTRUCTIONS:
1. PROBABLE XI: Pick exactly 11 per team ONLY from squad lists above. Any name not listed is WRONG.
2. FORM BATSMEN/BOWLERS: Use the web data above for comprehensive stats. Cite real scores/figures.
3. PITCH REPORT: Use web data. Be specific about conditions.
4. HEAD TO HEAD: Combine web + database records.
5. KEY MATCHUPS: Based on in-form players from web data.
6. PREDICTION: Based on all data above.

Return ONLY valid JSON:
{"home_probable_xi":[...11],"away_probable_xi":[...11],"home_form_batsmen":"...","away_form_batsmen":"...","home_form_bowlers":"...","away_form_bowlers":"...","pitch_report":"...","head_to_head":"...","key_matchups":"...","prediction_summary":"..."}
Do not include any other text or markdown formatting.`;

  // Call Groq with fallback models
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastError = "";

  for (const apiKey of apiKeys) {
    for (const model of models) {
      console.log(`📡 Generating with Groq model ${model}...`);
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model, temperature: 0.4, response_format: { type: "json_object" } }),
          signal: AbortSignal.timeout(30000)
        });
        if (!res.ok) { const errData = await res.json().catch(() => ({})); lastError = `${model}: ${errData?.error?.message || `HTTP ${res.status}`}`; console.error(`⚠️ Groq error: ${lastError}`); continue; }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) { lastError = `${model}: Empty response`; continue; }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { lastError = `${model}: Invalid JSON`; continue; }
        console.log(`✅ Success with Groq ${model}`);
        return { success: true, insights: JSON.parse(jsonMatch[0]) };
      } catch (err) { lastError = `${model}: ${err.message}`; continue; }
    }
  }

  return {
    success: false, error: lastError,
    insights: { home_probable_xi: ["TBA"], away_probable_xi: ["TBA"], home_form_batsmen: "Pending", away_form_batsmen: "Pending", home_form_bowlers: "Pending", away_form_bowlers: "Pending", pitch_report: "AI API quota limit reached.", head_to_head: "N/A", key_matchups: "AI Service offline.", prediction_summary: `Error: ${lastError}` }
  };
}
