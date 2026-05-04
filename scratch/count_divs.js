const fs = require('fs');
const content = fs.readFileSync('c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios/src/modules/Informes.tsx', 'utf8');
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log(`Open: ${openDivs}, Close: ${closeDivs}`);
