import webpush from "web-push";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify ENV presence for VAPID logic gracefully
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@iplfantasy.com",
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default async function handler(req, res) {
  // Allow RESTful mapping (POST for cron safety, GET for manual test safety)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !process.env.VAPID_PRIVATE_KEY) {
     return res.status(500).json({ error: "Missing required VAPID Keys or DB Config on backend!" });
  }

  try {
     // 1. Gather match timestamps directly 
     const matchesRes = await fetch(`${SUPABASE_URL}/rest/v1/matches?select=*`, {
       headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
     });
     const matches = await matchesRes.json();
     
     const now = new Date();
     
     const upcomingMatches = matches.filter(m => {
       const matchTime = new Date(m.date);
       const diffHours = (matchTime - now) / (1000 * 60 * 60);
       
       // Detect matches strictly inside the "3 Hour" window (between 2.0 to 3.0 hours away)
       const is3HourWindow = diffHours > 2.0 && diffHours <= 3.0;
       
       // Detect matches strictly inside the "Final 1 Hour" window (between 0.0 to 1.0 hours away)
       const is1HourWindow = diffHours > 0.0 && diffHours <= 1.0;

       // Since the cron triggers strictly hourly, each window will naturally capture exactly one cron ping.
       return is3HourWindow || is1HourWindow;
     });

     if (upcomingMatches.length === 0) {
       return res.status(200).json({ message: "No matches scheduled within target alert windows." });
     }
     const upcomingMatchIds = upcomingMatches.map(m => m.id);

     // 2. Query all users who have natively subscribed to notifications
     const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
       headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
     });
     const subscriptions = await subsRes.json();

     if (!subscriptions.length) {
       return res.status(200).json({ message: "No hardware subscribers detected." });
     }

     // 3. See who uniquely already placed pick projections for the imminent matches!
     const selRes = await fetch(`${SUPABASE_URL}/rest/v1/selections?match_id=in.(${upcomingMatchIds.join(',')})&select=username`, {
       headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
     });
     const selections = await selRes.json();
     
     // Compile strict Set array grouping all uniquely completed users
     const secureUsers = new Set(selections.map(s => s.username));

     // 4. Eject pushes strictly targeting missing player projections.
     let sentCount = 0;
     const notifications = [];

     for (const sub of subscriptions) {
        if (!secureUsers.has(sub.username)) {
           const payload = JSON.stringify({
             title: "🚨 Match Locks Soon!",
             body: `You haven't locked in your IPL Fantasy picks for today's match! Tap to select.`,
             url: "/"
           });
           
           const pushSub = {
             endpoint: sub.endpoint,
             keys: {
               p256dh: sub.keys_p256dh,
               auth: sub.keys_auth
             }
           };

           notifications.push(
             webpush.sendNotification(pushSub, payload).then(() => { sentCount++; }).catch(e => {
                console.error(`Subscription token dead for ${sub.username}.`, e);
             })
           );
        }
     }

     await Promise.allSettled(notifications);

     return res.status(200).json({ message: `Scanned. Blasted ${sentCount} user push notifications globally.` });

  } catch (err) {
     return res.status(500).json({ error: err.message });
  }
}
