const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CATEGORIES = [
    { name: 'Computadores', url: 'https://www.mps.com.co/productos/categorias/computadores' },
    { name: 'Gaming', url: 'https://www.mps.com.co/productos/categorias/gaming' },
    { name: 'Celulares y Tablets', url: 'https://www.mps.com.co/productos/categorias/celulares-y-tablets' },
    { name: 'Impresión', url: 'https://www.mps.com.co/productos/categorias/impresi%C3%B3n' },
    { name: 'Almacenamiento', url: 'https://www.mps.com.co/productos/categorias/almacenamiento' },
    { name: 'Redes', url: 'https://www.mps.com.co/productos/categorias/redes' },
    { name: 'Accesorios y Periféricos', url: 'https://www.mps.com.co/productos/categorias/accesorios-y-perifericos' },
    { name: 'Energía', url: 'https://www.mps.com.co/productos/categorias/energ%C3%ADa' }
];

async function syncMPS() {
    console.log('--- Iniciando Sincronización MPS via API (Alta Fidelidad) ---');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const dataPath = path.join(__dirname, '../data/mps_products.json');

    try {
        console.log('Autenticando en mps.com.co...');
        await page.goto('https://www.mps.com.co/login', { waitUntil: 'networkidle', timeout: 60000 });
        await page.fill('input#nit', '900686378');
        await page.fill('input#password', 'Temporal.12*');
        await page.click('button.btn-primary-dark-w');
        
        // Esperar a que la sesión esté lista
        await page.waitForSelector('.u-header__nav-link, .nav-link', { timeout: 20000 }).catch(() => console.log('Aviso: Timeout esperando selector interno, continuando...'));

        const productMap = new Map();

        for (const cat of CATEGORIES) {
            // Limpiar slug para la API (manejo de tildes y codificación)
            const catId = cat.url.split('/').pop().replace(/%C3%B3/g, 'o').replace(/%C3%AD/g, 'i'); 
            console.log(`\nConsultando API para categoría: ${cat.name} (${catId})...`);
            
            try {
                // Realizar el fetch desde el contexto de la página para heredar cookies/tokens
                const apiData = await page.evaluate(async (cid) => {
                    const response = await fetch('/api/productos/filtro', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN=')).split('=')[1])
                        },
                        body: JSON.stringify({
                            idcategoria: cid,
                            pagina: 1,
                            filtroDisponible: 0
                        })
                    });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                }, catId);

                if (apiData && apiData.listaproductos) {
                    apiData.listaproductos.forEach(p => {
                        const cleanSku = p.Sku.replace(/#/g, '').replace(/\//g, '-');
                        const id = `mps-${cleanSku}`;
                        
                        // Si ya existe, no lo sobreescribimos (o podrías combinar categorías, pero SKU es único en teoría)
                        if (!productMap.has(id)) {
                            productMap.set(id, {
                                id: id,
                                name: p.Name,
                                category: cat.name,
                                subcategory: p.Categoria || 'General',
                                price: null, // Restricción: Sin precios
                                image: p.Imagenes && p.Imagenes.length > 0 ? p.Imagenes[0] : '',
                                url: `https://www.mps.com.co/productos/${p.slug}`,
                                description: `Stock: ${p.Quantity > 0 ? 'Producto disponible' : 'Consultar disponibilidad'}`
                            });
                        }
                    });
                    
                    console.log(`  Procesados ${apiData.listaproductos.length} productos (Unicos acumulados: ${productMap.size}).`);
                }
            } catch (err) {
                console.error(`  Error consultando API para ${cat.name}:`, err.message);
            }
        }

        // Guardar resultados finales
        const allProducts = Array.from(productMap.values());
        fs.writeFileSync(dataPath, JSON.stringify(allProducts, null, 2));
        console.log(`\nSincronización MPS finalizada. Total únicos: ${allProducts.length} productos ✅`);

    } catch (error) {
        console.error('ERROR CRÍTICO EN SYNC MPS:', error.message);
    } finally {
        await browser.close();
    }
}

syncMPS();
