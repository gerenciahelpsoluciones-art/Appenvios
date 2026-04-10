const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MAIN_CATEGORIES = [
    { name: 'Computo', slug: 'computo' },
    { name: 'Accesorios', slug: 'Accesorios' },
    { name: 'Gaming', slug: 'Gaming' },
    { name: 'Servidores', slug: 'Servidores' },
    { name: 'Networking', slug: 'Networking' },
    { name: 'Impresión y Suministros', slug: 'Impresion-y-Suministros' },
    { name: 'Movilidad', slug: 'Movilidad' },
    { name: 'Cámaras y Video', slug: 'camaras--audio-y-videos' },
    { name: 'Monitores', slug: 'Monitores' },
    { name: 'Potencia', slug: 'Potencia' },
    { name: 'Servicios', slug: 'Servicios' },
    { name: 'Ciberseguridad', slug: 'Ciberseguridad' },
    { name: 'Licenciamiento y Cloud', slug: 'Licenciamiento-y-cloud' },
    { name: 'Energías Renovables', slug: 'Energias-Renovables' }
];

async function syncCatalog() {
    console.log('--- Iniciando Sincronización v8.8 (RESILIENT INCREMENTAL) ---');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const dataPath = path.join(__dirname, '../data/external_products.json');

    try {
        console.log('Login...');
        await page.goto('https://www.idoneaservice.com/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const emailOpt = await page.$('.vtex-login-2-x-emailPasswordOptionBtn');
        if (emailOpt) await emailOpt.click();
        await page.fill('input[placeholder*="mail"]', 'angevilla_99@yahoo.es');
        await page.fill('input[type="password"]', 'Lupe*2025');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        let allProducts = [];
        const seenUrls = new Set();

        for (const cat of MAIN_CATEGORIES) {
            console.log(`\nCargando ${cat.name}...`);
            try {
                await page.goto(`https://www.idoneaservice.com/${cat.slug}`, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(3000);

                const showMore = await page.$('button.vtex-search-result-3-x-buttonShowMore');
                if (showMore) {
                    await showMore.click();
                    await page.waitForTimeout(2000);
                }

                const products = await page.evaluate((mName) => {
                    const items = Array.from(document.querySelectorAll('.vtex-product-summary-2-x-container'));
                    return items.map((item, index) => {
                        const nameNode = item.querySelector('.vtex-product-summary-2-x-brandName');
                        const imgNode = item.querySelector('img.vtex-product-summary-2-x-image');
                        const linkNode = item.querySelector('a.vtex-product-summary-2-x-clearLink');
                        return {
                            id: `idonea-${mName}-${index}`,
                            name: (nameNode ? nameNode.textContent : 'Hardware').trim(),
                            category: mName,
                            subcategory: 'General',
                            price: null,
                            image: imgNode ? imgNode.getAttribute('src') : '',
                            url: linkNode ? `https://www.idoneaservice.com${linkNode.getAttribute('href')}` : ''
                        };
                    });
                }, cat.name);

                products.forEach(p => {
                    if (p.url && !seenUrls.has(p.url)) {
                        seenUrls.add(p.url);
                        allProducts.push(p);
                    }
                });
                
                // GUARDADO INCREMENTAL
                fs.writeFileSync(dataPath, JSON.stringify(allProducts, null, 2));
                console.log(`  Guardados ${allProducts.length} productos hasta ahora...`);

            } catch (e) {
                console.error(`  Error saltando ${cat.name}: ${e.message}`);
                // Reintentar login si el error parece una desconexión
            }
        }

        console.log(`\nSincronización v8.8 completada con ${allProducts.length} productos ✅`);

    } catch (e) {
        console.error('ERROR CRÍTICO:', e.message);
    } finally {
        await browser.close();
    }
}

syncCatalog();
