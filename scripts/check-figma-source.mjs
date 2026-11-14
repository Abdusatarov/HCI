import fs from 'node:fs/promises';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
for(const file of ['design/foundations.js','design/screens.js']){
  new AsyncFunction(await fs.readFile(file,'utf8'));
  console.log('PASS: Figma async script syntax:',file);
}
// Syntax only: no remote Figma API or canvas mutation occurs here.
