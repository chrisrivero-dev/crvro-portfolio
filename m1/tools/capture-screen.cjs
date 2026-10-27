const path = require('path');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8727/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const source = document.getElementById('screen');
    const clone = source.cloneNode(true);
    clone.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:400px;transform:none;opacity:1;visibility:visible;z-index:99999;margin:0;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;background:#0d0b08;overflow:hidden;';
    document.body.appendChild(clone);
  });
  await page.screenshot({
    path: path.join(__dirname, '..', 'assets', 'screen-dom.png'),
    clip: { x: 0, y: 0, width: 600, height: 400 },
  });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
