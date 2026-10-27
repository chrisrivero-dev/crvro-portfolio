/* M1.5 exploration captures: same camera + lights for every variant. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const OUT = path.join(__dirname, '..', 'captures', 'iter-01');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'],
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 } });
  const errors = {};
  for (const v of ['a', 'b', 'c']) {
    const page = await browser.newPage();
    errors[v] = [];
    page.on('pageerror', (e) => errors[v].push(String(e)));
    await page.goto(`http://127.0.0.1:8728/${v}.html`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    for (const view of ['threeQuarter', 'front', 'top']) {
      await page.evaluate((x) => window.__M1__.setView(x), view);
      await sleep(400);
      await page.screenshot({ path: path.join(OUT, `${v}-${view}.png`) });
    }
    await page.evaluate(() => { window.__M1__.setView('threeQuarter'); document.getElementById('pins-toggle').click(); });
    await sleep(400);
    await page.screenshot({ path: path.join(OUT, `${v}-destinations.png`) });
    await page.close();
  }
  const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64');
  const cmp = await browser.newPage();
  await cmp.setViewport({ width: 2400, height: 1060 });
  const names = { a: 'A · GIS drafting workstation', b: 'B · Software studio', c: 'C · Technical archive' };
  await cmp.setContent(`<body style="margin:0;background:#111;color:#ddd;font:15px monospace;display:grid;grid-template-columns:repeat(3,800px)">
    ${['a', 'b', 'c'].map((v) => `<figure style="margin:0"><img src="${img(v + '-threeQuarter.png')}" style="width:800px;display:block"><figcaption style="padding:8px 10px">${names[v]} — rest</figcaption></figure>`).join('')}
    ${['a', 'b', 'c'].map((v) => `<figure style="margin:0"><img src="${img(v + '-destinations.png')}" style="width:800px;display:block"><figcaption style="padding:8px 10px">${names[v]} — destinations</figcaption></figure>`).join('')}
  </body>`);
  await cmp.screenshot({ path: path.join(OUT, 'compare.png'), fullPage: true });
  console.log(JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
