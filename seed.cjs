const fs = require('fs');

async function seed() {
  const content = fs.readFileSync('src/App.jsx', 'utf-8');
  const supaUrlMatch = content.match(/const SUPABASE_URL = "(.*?)";/);
  const supaKeyMatch = content.match(/const SUPABASE_ANON_KEY = "(.*?)";/);
  
  if (!supaUrlMatch || !supaKeyMatch) {
    console.error("Could not find Supabase credentials");
    return;
  }
  
  const SUPABASE_URL = supaUrlMatch[1];
  const SUPABASE_ANON_KEY = supaKeyMatch[1];
  
  const FANTASY_PLAYERS = ["Ani","Haren","Ganga","Jitendar","Mahesh","Nag","Naren","Navdeep","Omkar","Peddi","Praveen","Raghav","Ranga","Rohit","Sandeep","Santhosh","Soma","Sridhar K","Krishna","Venky","Naresh","Srikanth B","Prashanth","Sreeram","Santhosh Male","Ranjith"];
  const WICKET_RANGES = ["<5","5-8","9-11","12-13","14-15","16-17","18-20"];
  const DOUBLE_CATEGORIES = ["Winning Team","Best Batsman","Best Bowler","Powerplay Winner","Dot-Ball Bowler","Total Wickets"];

  const supaFetch = async (endpoint, options = {}) => {
    return fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: options.method === "POST" ? "resolution=merge-duplicates" : undefined
      }
    }).then(async res => { if(!res.ok) throw new Error(await res.text()); const txt = await res.text(); return txt ? JSON.parse(txt) : null; });
  };

  const PLAYERS = {
    CSK: ["Ruturaj Gaikwad","MS Dhoni","Sanju Samson","Dewald Brevis","Ayush Mhatre","Sarfaraz Khan","Shivam Dube"],
    DC:  ["Axar Patel","KL Rahul","Prithvi Shaw","Mitchell Starc","Kuldeep Yadav"],
    GT:  ["Shubman Gill","Jos Buttler","Rashid Khan","Mohammed Siraj"],
    KKR: ["Ajinkya Rahane","Sunil Narine","Andre Russell","Shreyas Iyer"],
    LSG: ["Rishabh Pant","Nicholas Pooran","Avesh Khan","Mayank Yadav"],
    MI:  ["Hardik Pandya","Rohit Sharma","Suryakumar Yadav","Jasprit Bumrah"],
    PBKS:["Marcus Stoinis","Arshdeep Singh","Yuzvendra Chahal","Marco Jansen"],
    RCB: ["Virat Kohli","Rajat Patidar","Bhuvneshwar Kumar","Tim David"],
    RR:  ["Riyan Parag","Yashasvi Jaiswal","Ravindra Jadeja","Kuldeep Sen"],
    SRH: ["Travis Head","Heinrich Klaasen","Pat Cummins","Abhishek Sharma"],
  };

  console.log("Fetching matches...");
  const matches = await supaFetch("matches?select=*&order=id.asc");
  const targetMatches = matches.filter(m => m.id <= 7);

  console.log(`Found ${targetMatches.length} matches up to M7. Seeding selections...`);

  let newSelections = [];
  
  for (const match of targetMatches) {
    const homeTeam = match.home;
    const awayTeam = match.away;
    const allPlayers = [...(PLAYERS[homeTeam] || []), ...(PLAYERS[awayTeam] || [])];
    
    if (allPlayers.length === 0) continue;

    for (const rawName of FANTASY_PLAYERS) {
      const username = rawName.toLowerCase().replace(/\s/g, "_");
      
      const p1 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const p2 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const p3 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const p4 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      
      const winningTeam = Math.random() > 0.5 ? homeTeam : awayTeam;
      
      newSelections.push({
        username: username,
        match_id: match.id,
        winning_team: winningTeam,
        best_batsman: p1,
        best_bowler: p2,
        powerplay_winner: winningTeam,
        dot_ball_bowler: p3,
        total_wickets: WICKET_RANGES[Math.floor(Math.random() * WICKET_RANGES.length)],
        duck_batsman: p4,
        double_category: DOUBLE_CATEGORIES[Math.floor(Math.random() * DOUBLE_CATEGORIES.length)],
        winning_horse: FANTASY_PLAYERS[Math.floor(Math.random() * FANTASY_PLAYERS.length)],
        losing_horse: FANTASY_PLAYERS[Math.floor(Math.random() * FANTASY_PLAYERS.length)],
        saved_at: new Date().toISOString()
      });
    }
  }

  console.log(`Sending ${newSelections.length} selections to Supabase...`);
  
  // Chunk sending
  const chunkSize = 50;
  for (let i = 0; i < newSelections.length; i += chunkSize) {
    const chunk = newSelections.slice(i, i + chunkSize);
    await supaFetch("selections?on_conflict=username,match_id", {
      method: "POST",
      body: JSON.stringify(chunk)
    });
    console.log(`Sent chunk ${i / chunkSize + 1}`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
