// api/lib/insights.mjs
// Scrape real cricket data from the web, then use Gemini (without search) to structure it

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

// ─── STEP 1: Fetch real-time match context via Tavily ────────────────────────

async function tavilySearch(query, tavilyKey, opts = {}) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tavilyKey}` },
      body: JSON.stringify({
        query,
        topic: "news",
        search_depth: "basic",
        max_results: 5,
        time_range: "week",        // Only articles from the last 7 days
        include_answer: false,
        include_raw_content: false,
        country: "india",
        ...opts
      }),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`⚠️ Tavily error: ${err?.detail || res.status}`);
      return "";
    }
    const data = await res.json();
    // Concatenate titles + content snippets from each result
    return (data.results || [])
      .map(r => `[${r.title}]\n${r.content}`)
      .join("\n\n");
  } catch (e) {
    console.log(`⚠️ Tavily search failed for "${query}":`, e.message);
    return "";
  }
}

async function fetchMatchContext(homeTeam, awayTeam, homeFull, awayFull, tavilyKey) {
  if (!tavilyKey) {
    console.log("⚠️ TAVILY_API_KEY not set — skipping live search");
    return null;
  }

  console.log(`🔍 Tavily: fetching live match context for ${homeTeam} vs ${awayTeam}...`);

  // Run two targeted searches in parallel — match preview + pitch/venue
  const [matchContext, pitchContext] = await Promise.all([
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 match preview probable XI playing 11 team news`, tavilyKey),
    tavilySearch(`${homeFull} vs ${awayFull} IPL 2026 pitch report venue head to head`, tavilyKey),
  ]);

  const combined = [matchContext, pitchContext].filter(Boolean).join("\n\n");
  console.log(`📰 Tavily returned ${combined.length} chars of live match context`);
  return combined || null;
}

// ─── STEP 2: Use Groq LLM to structure the data ─────────────────────────────

export async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  const keysInput = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  const apiKeys = keysInput.split(',').map(k => k.trim()).filter(Boolean);
  const tavilyKey = process.env.TAVILY_API_KEY || "";

  if (!apiKeys.length) {
    return { success: false, error: "GROQ_API_KEYS missing" };
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  // Step 1: Fetch live match context via Tavily
  let scrapedContext = "";
  try {
    scrapedContext = await fetchMatchContext(homeTeam, awayTeam, homeFull, awayFull, tavilyKey) || "";
  } catch (e) {
    console.log("⚠️ Tavily fetch failed, proceeding with squad data only:", e.message);
  }

  // Step 2: Build roster-constrained prompt
  const homeSquad = SQUADS_2026[homeTeam] || [];
  const awaySquad = SQUADS_2026[awayTeam] || [];

  const rosterBlock = `
CRITICAL CONSTRAINT — IPL 2026 OFFICIAL SQUADS:
You MUST ONLY select players from these verified rosters. Do NOT use any player not listed below.

${homeTeam} (${homeFull}) Full Squad:
${homeSquad.join(", ")}

${awayTeam} (${awayFull}) Full Squad:
${awaySquad.join(", ")}
`;

  const contextBlock = scrapedContext
    ? `\nHere is recent news and data scraped from cricket websites about this match. Use this as additional context:\n---\n${scrapedContext.substring(0, 3000)}\n---\n`
    : "";

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) scheduled on ${matchDate}:
${rosterBlock}
${contextBlock}
Based on the official squads above and any scraped context, provide:
1. PROBABLE PLAYING XI for both teams (11 players each). You MUST pick ONLY from the squad lists above. Any name not in those lists is WRONG.
2. IN-FORM BATSMEN and BOWLERS for both teams.
3. PITCH REPORT and Venue analysis.
4. HEAD TO HEAD summary for IPL 2026 season.
5. KEY MATCHUPS to watch.
6. PREDICTION SUMMARY.

IMPORTANT: Return your response ONLY as a valid JSON object with exactly these keys:
{
  "home_probable_xi": ["Full Name 1", ...],
  "away_probable_xi": ["Full Name 1", ...],
  "home_form_batsmen": "...",
  "away_form_batsmen": "...",
  "home_form_bowlers": "...",
  "away_form_bowlers": "...",
  "pitch_report": "...",
  "head_to_head": "...",
  "key_matchups": "...",
  "prediction_summary": "..."
}
Do not include any other text or markdown formatting.`;

  // Step 3: Call Groq API natively
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ];

  let lastError = "";

  for (const apiKey of apiKeys) {
    for (const model of models) {
      console.log(`📡 Generating with Groq model ${model}...`);
      const url = `https://api.groq.com/openai/v1/chat/completions`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: model,
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(15000)
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
