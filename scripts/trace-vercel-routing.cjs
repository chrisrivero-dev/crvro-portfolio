/* Offline reproduction of how Vercel builds this project's route table, using Vercel's own libraries (@vercel/fs-detectors for the
 * function/dynamic-route detection, @vercel/routing-utils for vercel.json transformation and the phase merge). Nothing is deployed or
 * fetched. The libraries are not dependencies of this repo: install them in a scratch directory and point VR at it:
 *   (mkdir /tmp/vr && cd /tmp/vr && npm i @vercel/fs-detectors @vercel/routing-utils)
 *   VR=/tmp/vr node scripts/trace-vercel-routing.cjs
 * Prints the merged route table for the current vercel.json and for the proposed one, then runs a request matrix through each. */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const VR = process.env.VR || '/private/tmp/claude-501/vr';
const req = (m) => require(require.resolve(m, { paths: [VR] }));
const { detectBuilders } = req('@vercel/fs-detectors');
const { getTransformedRoutes, appendRoutesToPhase } = req('@vercel/routing-utils');
const root = path.join(__dirname, '..');
const files = execSync('git ls-files', { cwd: root }).toString().split('\n').filter((f) => f && !/^(captures|m15|m1)\//.test(f));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

async function mergedRoutes(cfg) {
  const built = await detectBuilders(files, pkg, { projectSettings: { framework: 'vite' }, featHandleMiss: true });
  const user = getTransformedRoutes({ rewrites: cfg.rewrites, trailingSlash: cfg.trailingSlash });
  // the CLI appends the builders' dynamic-route rewrites to the END of the filesystem phase, i.e. after the user's own rewrites
  let routes = appendRoutesToPhase({ routes: user.routes, newRoutes: built.rewriteRoutes, phase: 'filesystem' });
  routes = appendRoutesToPhase({ routes, newRoutes: built.defaultRoutes, phase: null });
  return { routes, builderRoutes: built.rewriteRoutes };
}

const FUNCTIONS = new Set(['/api/ask', '/api/worker/claim', '/api/worker/extend', '/api/worker/submit', '/api/result/[id]']);
const STATIC = new Set(['/index.html', '/favicon.svg', '/robots.txt', '/sitemap.xml', '/monogram.svg', '/wordmark.svg']);
const inFs = (p) => STATIC.has(p) || p.startsWith('/assets/') || p.startsWith('/images/') || FUNCTIONS.has(p);

/** Vercel's phase order: routes before `handle: filesystem`, the filesystem itself, routes after it (rewrites with check:true re-check the filesystem), `miss`, 404. */
function resolve(routes, url) {
  const fsIdx = routes.findIndex((r) => r.handle === 'filesystem');
  const missIdx = routes.findIndex((r) => r.handle === 'miss');
  const pre = routes.slice(0, fsIdx), post = routes.slice(fsIdx + 1, missIdx === -1 ? undefined : missIdx), miss = missIdx === -1 ? [] : routes.slice(missIdx + 1);
  const run = (list, p) => {
    for (const r of list) {
      if (r.handle) continue;
      const m = new RegExp(r.src).exec(p);
      if (!m) continue;
      if (r.status && !r.dest && !r.headers) return { done: `HTTP ${r.status}` };
      if (r.headers?.Location) return { done: `redirect ${r.status} -> ${r.headers.Location.replace(/\$(\d+)/g, (_, i) => m[+i])}` };
      const dest = r.dest.replace(/\$(\d+)/g, (_, i) => m[+i] || '').split('?')[0];
      if (r.check && !inFs(dest)) continue;
      return { done: `${FUNCTIONS.has(dest) ? 'FUNCTION' : 'static/SPA'} ${dest}${r.dest.includes('?') ? ' (' + r.dest.split('?')[1].replace('$1', '<param>') + ')' : ''}` };
    }
    return null;
  };
  let r = run(pre, url); if (r) return r.done;
  if (inFs(url)) return `${FUNCTIONS.has(url) ? 'FUNCTION' : 'static'} ${url}`;
  r = run(post, url); if (r) return r.done;
  r = run(miss, url); if (r) return r.done;
  return '404';
}

const matrix = ['/api/ask', '/api/result/abc', '/api/result/00000000-0000-0000-0000-000000000000', '/api/worker/claim', '/api/worker/extend', '/api/worker/submit', '/api/nothing', '/api', '/projects/zarvin-one', '/projects/proof-first', '/', '/robots.txt', '/assets/index-abc.js', '/some/spa/route'];
const variants = {
  'CURRENT': current,
  'PROPOSED': { ...current, rewrites: [{ source: '/((?!api/).*)', destination: '/index.html' }] },
};
(async () => {
  const results = {};
  for (const [name, cfg] of Object.entries(variants)) {
    const { routes, builderRoutes } = await mergedRoutes(cfg);
    console.log(`\n=== ${name}: rewrites ${JSON.stringify(cfg.rewrites)} ===`);
    console.log('builder-generated dynamic routes:', JSON.stringify(builderRoutes));
    console.log('merged route table:'); routes.forEach((r, i) => console.log(`  ${i}. ${JSON.stringify(r)}`));
    results[name] = {};
    for (const u of matrix) { results[name][u] = resolve(routes, u); }
  }
  console.log('\nrequest'.padEnd(54) + 'CURRENT'.padEnd(46) + 'PROPOSED');
  for (const u of matrix) console.log(u.padEnd(53) + results.CURRENT[u].padEnd(46) + results.PROPOSED[u]);
  const changed = matrix.filter((u) => results.CURRENT[u] !== results.PROPOSED[u]);
  console.log('\nrequests whose handling changes:', changed.join(', '));
})();
