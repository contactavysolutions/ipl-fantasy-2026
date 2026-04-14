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

// ─── STEP 1: Scrape real match context from the web ──────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchGoogleNewsContext(homeTeam, awayTeam, homeFull, awayFull) {
  const queries = [
    `${homeFull} vs ${awayFull} IPL 2026 match preview probable XI`,
    `${homeTeam} vs ${awayTeam} IPL 2026 pitch report`,
  ];

  let allSnippets = [];

  for (const q of queries) {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(rssUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; IPLFantasyBot/1.0)" },
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Extract titles and descriptions from RSS XML
      const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)].map(m => m[1]);
      const descs = [...xml.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)].map(m => stripHtml(m[1]));

      // Also try without CDATA
      const titles2 = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map(m => m[1]).filter(t => t !== "Google News");
      const descs2 = [...xml.matchAll(/<description>([^<]+)<\/description>/g)].map(m => m[1]);

      allSnippets.push(...titles, ...titles2, ...descs, ...descs2);
    } catch (e) {
      console.log(`⚠️ Google News fetch failed for "${q}":`, e.message);
    }
  }

  return allSnippets.filter(Boolean).slice(0, 30).join("\n");
}

async function fetchCricbuzzContext(homeTeam, awayTeam) {
  try {
    const searchUrl = `https://www.cricbuzz.com/cricket-match/live-scores`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return "";
    const html = await res.text();
    const text = stripHtml(html);
    // Extract any relevant snippets mentioning our teams
    const sentences = text.split(/[.!?]/).filter(s =>
      s.toLowerCase().includes(homeTeam.toLowerCase()) ||
      s.toLowerCase().includes(awayTeam.toLowerCase())
    );
    return sentences.slice(0, 10).join(". ");
  } catch (e) {
    console.log("⚠️ Cricbuzz fetch failed:", e.message);
    return "";
  }
}

async function fetchMatchContext(homeTeam, awayTeam, homeFull, awayFull) {
  console.log(`🔍 Scraping match context for ${homeTeam} vs ${awayTeam}...`);

  // Try multiple sources in parallel
  const [newsContext, cricbuzzContext] = await Promise.all([
    fetchGoogleNewsContext(homeTeam, awayTeam, homeFull, awayFull),
    fetchCricbuzzContext(homeFull, awayFull),
  ]);

  const combined = [newsContext, cricbuzzContext].filter(Boolean).join("\n\n");
  const contextLength = combined.length;
  console.log(`📰 Scraped ${contextLength} chars of match context`);

  return combined || null;
}

// ─── STEP 2: Use Gemini (without search) to structure the data ───────────────

export async function generateInsights(homeTeam, awayTeam, matchDate, matchId) {
  const keysInput = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const apiKeys = keysInput.split(',').map(k => k.trim()).filter(Boolean);

  if (!apiKeys.length) {
    return { success: false, error: "GEMINI_API_KEYS missing in environment" };
  }

  const homeFull = TEAMS[homeTeam] || homeTeam;
  const awayFull = TEAMS[awayTeam] || awayTeam;

  // Step 1: Scrape real data from the web
  let scrapedContext = "";
  try {
    scrapedContext = await fetchMatchContext(homeTeam, awayTeam, homeFull, awayFull) || "";
  } catch (e) {
    console.log("⚠️ Scraping failed, proceeding with LLM knowledge only:", e.message);
  }

  // Step 2: Build a context-enriched prompt
  const contextBlock = scrapedContext
    ? `\n\nHere is recent news and data scraped from cricket websites about this match. Use this as your PRIMARY source of information:\n---\n${scrapedContext.substring(0, 4000)}\n---\n`
    : "\n\n(Note: No recent articles were found. Use your training knowledge about IPL 2026 teams and recent form.)\n";

  const prompt = `You are an expert IPL cricket analyst providing match preview insights for fantasy cricket players.

For the IPL 2026 match: ${homeFull} (${homeTeam}) vs ${awayFull} (${awayTeam}) scheduled on ${matchDate}:
${contextBlock}
Based on the above context and your knowledge, provide:
1. PROBABLE PLAYING XI for both teams (11 players each). Use actual squad members only.
2. IN-FORM BATSMEN and BOWLERS for both teams (with recent stats if available).
3. PITCH REPORT and Venue analysis.
4. HEAD TO HEAD summary.
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

  // Step 3: Call Gemini WITHOUT search tool (no quota issues)
  const models = [
    { id: "gemini-2.5-flash", version: "v1beta" },
    { id: "gemini-2.0-flash-001", version: "v1beta" },
  ];

  let lastError = "";

  for (const GEMINI_API_KEY of apiKeys) {
    for (const model of models) {
      console.log(`📡 Generating with ${model.id} using sharded key...`);
      const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.id}:generateContent?key=${GEMINI_API_KEY}`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
            // NO tools/googleSearch — we provide context ourselves
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData?.error?.message || `HTTP ${res.status}`;
          console.error(`⚠️ Gemini API error for ${model.id}: ${msg}`);
          lastError = `${model.id}: ${msg}`;
          continue; // Always continue to the next model/key combo instead of abandoning
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          lastError = `${model.id}: Empty response from API`;
          continue;
        }

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastError = `${model.id}: Invalid JSON format in response`;
          continue;
        }

        const insights = JSON.parse(jsonMatch[0]);
        console.log(`✅ Success with ${model.id}`);
        return { success: true, insights };
      } catch (err) {
        console.error(`⚠️ Error with ${model.id}:`, err.message);
        lastError = `${model.id}: ${err.message}`;
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
