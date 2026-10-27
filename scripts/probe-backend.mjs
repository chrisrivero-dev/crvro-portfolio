// Read-only probes of the deployed Public Captain broker. Deliberately NO POST /api/ask: that would enqueue a real job for the
// owner's worker. Only OPTIONS (CORS preflight) and a GET for an id that cannot exist. Run: node scripts/probe-backend.mjs [origin]
const target = process.argv[2] || 'https://www.crvro.com';
const origins = [target, 'https://crvro.com', 'https://crvro.vercel.app', 'http://localhost:5173', 'https://example.invalid'];
const row = (name, v) => console.log(name.padEnd(46), v);
async function go(url, init) {
  try {
    const r = await fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(12000) });
    const ct = r.headers.get('content-type') || '';
    const body = ct.includes('json') ? JSON.stringify(await r.json()).slice(0, 120) : `(${ct.split(';')[0] || 'no body'})`;
    return { status: r.status, acao: r.headers.get('access-control-allow-origin'), vary: r.headers.get('vary'), server: r.headers.get('server'), body };
  } catch (e) { return { error: String(e.cause?.code || e.message) }; }
}
console.log(`target ${target}  ${new Date().toISOString()}`);
const g = await go(`${target}/api/result/zz-probe-nonexistent`);
row('GET /api/result/<nonexistent>', JSON.stringify(g));
for (const o of origins) {
  const r = await go(`${target}/api/ask`, { method: 'OPTIONS', headers: { Origin: o, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  row(`OPTIONS /api/ask  Origin: ${o}`, JSON.stringify({ status: r.status, 'allow-origin': r.acao, error: r.error }));
}
const home = await go(`${target}/`);
row('GET /  (site itself)', JSON.stringify({ status: home.status, server: home.server }));
