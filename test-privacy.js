const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('file:///Users/akashs/.gemini/antigravity-ide/scratch/caret-website/privacy.html', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
