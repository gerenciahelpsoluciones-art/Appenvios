const fs = require('fs');
const path = require('path');

const mpsDataPath = path.join(__dirname, '../data/mps_products.json');
const externalDataPath = path.join(__dirname, '../data/external_products.json');

function mergeProducts() {
    console.log('--- Iniciando Mezcla de Productos (MPS + Idonea) ---');

    if (!fs.existsSync(mpsDataPath)) {
        console.error('Error: mps_products.json no encontrado.');
        return;
    }

    const mpsProducts = JSON.parse(fs.readFileSync(mpsDataPath, 'utf8'));
    let externalProducts = [];

    if (fs.existsSync(externalDataPath)) {
        externalProducts = JSON.parse(fs.readFileSync(externalDataPath, 'utf8'));
    }

    // Filtrar productos antiguos que NO sean de idonea o MPS (limpieza preventiva)
    // Mantener solo los de idonea para volver a añadir los nuevos de MPS
    const idoneaProducts = externalProducts.filter(p => p.id.startsWith('idonea-'));
    
    console.log(`Productos Idonea actuales: ${idoneaProducts.length}`);
    console.log(`Nuevos productos MPS: ${mpsProducts.length}`);

    const finalCatalog = [...idoneaProducts, ...mpsProducts];

    fs.writeFileSync(externalDataPath, JSON.stringify(finalCatalog, null, 2));
    console.log(`Catálogo final actualizado con ${finalCatalog.length} productos totales ✅`);
}

mergeProducts();
