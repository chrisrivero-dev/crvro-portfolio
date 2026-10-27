/* Provenance check: is every fact shown on a floppy (the CRT directory) also on the case-study page, and do the expanded (immersive)
 * and classic case-study pages carry the same text? Floppy content is read from the live CRT DOM; the case pages are loaded in both modes;
 * the registry (src/data/projects.js) is the reference. Writes captures/iter-04d/claims.json. Run: node scripts/verify-claims.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const OUT = path.join(__dirname, '..', 'captures', 'iter-04d');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s).replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim().toLowerCase();

(async () => {
  const { PROJECTS, GIS_PROJECTS } = await import('../src/data/projects.js');
  const { DISK_ORDER } = await import('../src/data/caseIds.js');
  const reg = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const rows = [];
  for (const slug of DISK_ORDER) {
    const p = reg[slug];
    const fields = {
      titleEm: p.titleEm, kind: p.kind, year: p.year, desc: p.desc, status: p.status, role: p.role, outcome: p.outcome,
      tags: (p.tags || [])[0], 
    };
    const links = { demo: p.demo, site: p.site, repo: p.repo };
    const grab = async (url, wait3d) => {
      const page = await browser.newPage(); await page.setViewport({ width: 1500, height: 950 });
      await page.goto(BASE + url, { waitUntil: 'networkidle0' }); await sleep(900);
      const r = await page.evaluate(() => ({ text: (document.querySelector('article.case-study') || document.body).innerText, hrefs: [...document.querySelectorAll('article.case-study a[href]')].map((a) => a.getAttribute('href')) }));
      await page.close(); return r;
    };
    const immersive = await grab(`/projects/${slug}`);
    await (async () => { const p2 = await browser.newPage(); await p2.goto(BASE + '/?view=2d', { waitUntil: 'networkidle0' }); await p2.close(); })();
    const classicPage = await browser.newPage(); await classicPage.setViewport({ width: 1500, height: 950 });
    await classicPage.goto(BASE + '/?view=2d', { waitUntil: 'networkidle0' });
    await classicPage.goto(BASE + `/projects/${slug}`, { waitUntil: 'networkidle0' }); await sleep(900);
    const classic = await classicPage.evaluate(() => ({ text: (document.querySelector('article.case-study') || document.body).innerText, hrefs: [...document.querySelectorAll('article.case-study a[href]')].map((a) => a.getAttribute('href')) }));
    await classicPage.evaluate(() => localStorage.setItem('crvro.view', '3d')); await classicPage.close();
    // the floppy, from the live CRT DOM
    const fp = await browser.newPage(); await fp.setViewport({ width: 1500, height: 950 });
    await fp.goto(BASE + '/', { waitUntil: 'networkidle0' }); await fp.waitForFunction(() => window.__WS__, { timeout: 20000 }); await sleep(800);
    await fp.evaluate((s) => window.__WS__.ctl.load(s), slug);
    await fp.waitForFunction((s) => window.__WS__.ctl.state.session === s && document.querySelector('.ws-view'), { timeout: 20000 }, slug); await sleep(600);
    const floppy = await fp.evaluate(async () => {
      const out = {}; const files = [...document.querySelectorAll('.ws-list .ws-file')];
      for (let i = 0; i < files.length; i++) { files[i].click(); await new Promise((r) => setTimeout(r, 80)); const v = document.querySelector('.ws-view'); out[files[i].querySelector('.ws-fn').textContent + '.' + files[i].querySelector('.ws-fe').textContent] = { text: v.innerText, hrefs: [...v.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; }
      return out;
    });
    await fp.close();
    const floppyAll = norm(Object.values(floppy).map((f) => f.text).join(' '));
    const row = { slug, fields: {}, links: {}, sameText: norm(immersive.text) === norm(classic.text) };
    for (const [k, v] of Object.entries(fields)) { if (!v) continue; row.fields[k] = { onFloppy: floppyAll.includes(norm(v)), onCasePage: norm(immersive.text).includes(norm(v)) }; }
    for (const g of p.stack || []) for (const it of g.items) row.fields[`stack:${g.group}/${it}`] = { onFloppy: floppyAll.includes(norm(it)), onCasePage: norm(immersive.text).includes(norm(it)) };
    for (const [k, v] of Object.entries(links)) { if (!v) continue; row.links[k] = { onFloppy: Object.values(floppy).some((f) => f.hrefs.includes(v)), onCasePage: immersive.hrefs.includes(v) }; }
    rows.push(row);
    console.log(slug.padEnd(14), 'immersive==classic text:', row.sameText);
  }
  fs.writeFileSync(path.join(OUT, 'claims.json'), JSON.stringify(rows, null, 2));
  const gaps = [];
  for (const r of rows) for (const [k, v] of Object.entries({ ...r.fields, ...r.links })) if (v.onFloppy && !v.onCasePage) gaps.push(`${r.slug}.${k}`);
  console.log('\nshown on the floppy but NOT found verbatim on the case page:', gaps.length ? gaps.join(', ') : 'none');
  const unsourced = [];
  console.log('\nfield-by-field (F = on floppy, C = on case page):');
  for (const r of rows) console.log(r.slug.padEnd(14), Object.entries({ ...r.fields, ...r.links }).map(([k, v]) => `${k}:${v.onFloppy ? 'F' : '-'}${v.onCasePage ? 'C' : '-'}`).join('  '));
  await browser.close();
})();
