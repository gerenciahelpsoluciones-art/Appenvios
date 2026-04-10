const { chromium } = require('playwright');

async function testDataLayer() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navegando a Computo...');
        await page.goto('https://www.idoneaservice.com/computo', { waitUntil: 'networkidle' });
        
        // Extraer dataLayer
        const data = await page.evaluate(() => {
            return window.dataLayer.filter(d => d.ecommerce && d.ecommerce.impressions);
        });

        console.log('DataLayer Impressions found:', data.length);
        if (data.length > 0) {
            const firstImp = data[0].ecommerce.impressions[0];
            console.log('Muestra de producto en DataLayer:');
            console.log(`Nombre: ${firstImp.name}`);
            console.log(`Categoría Completa: ${firstImp.category}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

testDataLayer();
