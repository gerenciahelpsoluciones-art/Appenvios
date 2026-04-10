const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/external_products.json');
const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const KEYWORD_MAP = {
    'Portátil': ['Portátil', 'Laptop', 'Notebook', 'Macbook'],
    'Almacenamiento': ['Disco Duro', 'SSD', 'HDD', 'Sd ', 'Usb', 'Pen Drive', 'Memoria'],
    'Periféricos': ['Mouse', 'Teclado', 'Diadema', 'Audifonos', 'Webcam', 'Cámara Web'],
    'Monitores': ['Monitor', 'Pantalla', 'Led'],
    'Gaming': ['Gaming', 'Gamer', 'Mando', 'Joystick', 'Consola', 'Playstation', 'Xbox'],
    'Impresión': ['Impresora', 'Tinta', 'Cartucho', 'Toner', 'Papel'],
    'Servidores': ['Servidor', 'Rack', 'Blade'],
    'Networking': ['Switch', 'Router', 'Modem', 'Access Point', 'Wifi', 'Red'],
    'Potencia': ['Ups', 'Regulador', 'Bateria', 'Inversor'],
    'Movilidad': ['Celular', 'Smartphone', 'Tablet', 'Reloj Smart'],
    'Cámaras': ['Cámara', 'Dvr', 'Nvr', 'Cctv', 'Video'],
    'Seguridad': ['Antivirus', 'Kaspersky', 'Bitdefender', 'Licencia', 'Ciberseguridad'],
    'Nube/Cloud': ['Cloud', 'Office 365', 'Windows', 'Microsoft', 'Software']
};

function classify(name) {
    const n = name.toLowerCase();
    for (const [sub, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(k => n.includes(k.toLowerCase()))) {
            return sub;
        }
    }
    return 'General';
}

const updatedProducts = products.map(p => {
    const sub = classify(p.name);
    return {
        ...p,
        subcategory: sub,
        description: `Categoría: ${p.category} | Subcategoría: ${sub}`
    };
});

fs.writeFileSync(dataPath, JSON.stringify(updatedProducts, null, 2));
console.log(`Clasificadas ${updatedProducts.length} productos con éxito ✅`);
console.log('--- Resumen por Subcategoría ---');
const stats = updatedProducts.reduce((acc, p) => {
    acc[p.subcategory] = (acc[p.subcategory] || 0) + 1;
    return acc;
}, {});
console.log(stats);
