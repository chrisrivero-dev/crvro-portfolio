/* How the EXISTING PortfolioNavigator behaves for each backend outcome. The backend is SIMULATED here via request interception
 * (the real broker and the Mac-hosted worker are not reachable from this machine's dev server), so this proves the front end's
 * handling, not that the production backend is online. Run: node scripts/verify-lookup-states.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const note = (name, observed, ok) => { results.push({ name, observed, ok }); console.log(ok ? 'PASS' : 'NOTE', name, '->', observed); };

async function run(label, handler, { wait = 6000, polls = false } = {}) {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 900 });
  await p.setRequestInterception(true);
  const seen = [];
  p.on('request', (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/')) { seen.push(`${r.method()} ${u.pathname}`); handler(r, u, seen); } else r.continue();
  });
  await p.goto(BASE + '/#navigator', { waitUntil: 'networkidle0' });
  await p.waitForSelector('.retro-term-input', { timeout: 10000 });
  await sleep(500);
  await p.type('.retro-term-input', 'xylophone quantum marmalade'); await p.keyboard.press('Enter');
  await sleep(wait);
  const text = await p.$eval('.retro-term-result-region', (e) => e.innerText.replace(/\s+/g, ' ').trim());
  await b.close();
  return { text, seen };
}
// In `vite dev` the component calls http://localhost:8787 (cross-origin), so the simulated responses carry CORS headers and
// preflights are answered; in a production build the same calls are same-origin relative paths.
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const json = (r, status, body) => (r.method() === 'OPTIONS' ? r.respond({ status: 204, headers: CORS }) : r.respond({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) }));

(async () => {
  let o = await run('rate-limited', (r) => json(r, 429, { error: 'rate_limited' }), { wait: 1500 });
  note('POST /api/ask -> 429 rate_limited -> accurate rate-limit message (not "offline")', o.text, /too many questions/.test(o.text) && !/offline/i.test(o.text));
  o = await run('ask 500', (r) => json(r, 500, { error: 'x' }), { wait: 1500 });
  note('POST /api/ask -> 500', o.text, /offline/i.test(o.text));
  o = await run('html fallback (no backend, SPA rewrite)', (r) => r.respond({ status: 200, headers: CORS, contentType: 'text/html', body: '<html></html>' }), { wait: 1500 });
  note('/api returns HTML (no backend deployed)', o.text, /offline/i.test(o.text));
  o = await run('processing', (r) => (r.method() === 'POST' ? json(r, 200, { request_id: 'sim1' }) : json(r, 200, { status: 'processing' })), { wait: 5200 });
  note('queued -> processing (polls /api/result/:id every 1.5 s)', `${o.text} | calls: ${o.seen.slice(0, 4).join(', ')}`, /consulting portfolio intelligence/.test(o.text));
  o = await run('answered', (r) => (r.method() === 'POST' ? json(r, 200, { request_id: 'sim2' }) : json(r, 200, { status: 'answered', answer: 'SIMULATED ANSWER (test double).', routing: [{ role: 'CAPTAIN', status: 'used' }], destinations: ['proof-first', 'work'] })), { wait: 3500 });
  note('answered -> answer + destination links from the client registry', o.text, /SIMULATED ANSWER/.test(o.text) && /Proof First/.test(o.text) && /Project World/.test(o.text));
  o = await run('unresolved', (r) => (r.method() === 'POST' ? json(r, 200, { request_id: 'sim3' }) : json(r, 200, { status: 'unresolved', answer: 'SIMULATED: no evidence for that.', routing: [], destinations: [] })), { wait: 3500 });
  note('unresolved -> shown as a legitimate result, not as loading', o.text, /no evidence/.test(o.text));
  o = await run('expired', (r) => (r.method() === 'POST' ? json(r, 200, { request_id: 'sim4' }) : json(r, 404, { status: 'expired' })), { wait: 3500 });
  note('result expired (404) -> offline block', o.text, /offline/i.test(o.text));
  fs.writeFileSync(path.join(__dirname, '..', 'captures', 'iter-04c', 'lookup-states.json'), JSON.stringify(results, null, 2));
  console.log(`${results.filter((r) => r.ok).length}/${results.length} observed as expected`);
})();
