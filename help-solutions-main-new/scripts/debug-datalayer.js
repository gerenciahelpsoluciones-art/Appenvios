const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugDataLayer() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navegando a Computo...');
        await page.goto('https://www.idoneaservice.com/computo', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        const dl = await page.evaluate(() => {
            return {
                standard: window.dataLayer || [],
                vtex: window.vtex ? window.vtex.dataLayer : []
            };
        });

        fs.writeFileSync(path.join(__dirname, 'datalayer_dump.json'), JSON.stringify(dl, null, 2));
        console.log('DataLayer dump guardado ✅');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debugDataLayer();
