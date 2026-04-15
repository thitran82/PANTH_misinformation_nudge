// /api/log.js
// Receives participant decision + hesitancy timing and appends to an
// in-memory log. For a persistent experiment you would swap the
// console.log below for a database write (e.g. Supabase, Airtable,
// or a Google Sheets append via their API).
//
// Each record contains:
//   scenario_id   — which scenario (S1-S9 or 'live')
//   claim         — the claim text (live mode only)
//   truth_score   — PANTH truth score shown
//   harm_score    — PANTH harm score shown
//   decision      — 'yes' (share) or 'no' (do not share)
//   hesitancy_ms  — milliseconds between scores appearing and button click
//   mode          — 'demo' or 'live'
//   timestamp     — ISO 8601
//   ua            — truncated user agent (browser/OS, no PII)
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const {
    scenario_id, claim, truth_score, harm_score,
    decision, hesitancy_ms, mode, timestamp, ua
  } = req.body;
 
  // Validate required fields
  if (!decision || !['yes','no'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision value' });
  }
 
  const record = {
    scenario_id: scenario_id || 'unknown',
    claim: claim ? claim.substring(0, 300) : null,
    truth_score: typeof truth_score === 'number' ? truth_score : null,
    harm_score: typeof harm_score === 'number' ? harm_score : null,
    decision,
    hesitancy_ms: typeof hesitancy_ms === 'number' ? Math.round(hesitancy_ms) : null,
    hesitancy_sec: typeof hesitancy_ms === 'number' ? (hesitancy_ms / 1000).toFixed(2) : null,
    mode: mode || 'unknown',
    timestamp: timestamp || new Date().toISOString(),
    ua: ua ? ua.substring(0, 80) : null
  };
 
  // ── Primary storage: console.log (visible in Vercel Function Logs) ──────
  // Vercel retains function logs for 24h on free tier, longer on paid.
  // Go to: Vercel dashboard → your project → Logs tab → filter by /api/log
  console.log('[PANTH_DATA]', JSON.stringify(record));
 
  // ── Optional: write to external database ──────────────────────────────
  // Uncomment and configure ONE of these options if you want persistent storage:
  //
  // OPTION A — Airtable (easiest, no SQL needed, free tier available)
  // Requires: AIRTABLE_API_KEY and AIRTABLE_BASE_ID in Vercel env vars
  //
  // const Airtable = require('airtable');
  // const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
  //   .base(process.env.AIRTABLE_BASE_ID);
  // await base('Responses').create([{ fields: record }]);
  //
  // OPTION B — Google Sheets via Apps Script webhook
  // Requires: GOOGLE_SHEET_WEBHOOK_URL in Vercel env vars
  //
  // await fetch(process.env.GOOGLE_SHEET_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(record)
  // });
 
  return res.status(200).json({ ok: true, logged: record });
}
