import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`UNCAUGHT ERROR: ${error.message}`);
  });

  console.log("Navigating to Vercel...");
  await page.goto('https://2rpits-app.vercel.app', { waitUntil: 'networkidle0' });
  
  console.log("Done");
  await browser.close();
})();
