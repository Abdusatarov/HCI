import fs from 'node:fs/promises';
import { build } from 'esbuild';
import puppeteer from 'puppeteer';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox','--disable-setuid-sandbox']});
try {
  const mermaidPage=await browser.newPage();
  await mermaidPage.setContent('<html><body></body></html>');
  const bundle=await build({stdin:{contents:'import mermaid from "mermaid"; window.mermaid=mermaid;',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',minify:true});
  await mermaidPage.addScriptTag({content:bundle.outputFiles[0].text});
  const config=JSON.parse(await fs.readFile('scripts/mermaid.json','utf8'));
  for(const name of ['task-flow','user-flow']) {
    const source=await fs.readFile(`diagrams/${name}.mmd`,'utf8');
    const svg=await mermaidPage.evaluate(async(source,config)=>{window.mermaid.initialize({...config,startOnLoad:false,securityLevel:'strict'});await window.mermaid.parse(source);return (await window.mermaid.render('diagram',source)).svg;},source,config);
    await fs.writeFile(`diagrams/exports/${name}.svg`,svg);
    console.log('Mermaid parsed and exported:',name);
  }
  const page=await browser.newPage();
  await page.setContent('<html><head><style>body{margin:0;font-family:Arial}#canvas{width:16000px;height:1800px}.djs-label{font-family:Arial,sans-serif!important;font-size:12px!important}.bjs-powered-by{display:none}</style></head><body><div id="canvas"></div></body></html>');
  await page.addScriptTag({path:'node_modules/bpmn-js/dist/bpmn-viewer.development.js'});
  const xml=await fs.readFile('diagrams/pharmacy-order.bpmn','utf8');
  const diagrams=JSON.parse(await fs.readFile('diagrams/bpmn-manifest.json','utf8'));
  for(const item of diagrams) {
    const result=await page.evaluate(async(xml,id)=>{
      if(window.viewer)window.viewer.destroy();
      window.viewer=new BpmnJS({container:'#canvas'});
      const imported=await window.viewer.importXML(xml,id);
      const {svg}=await window.viewer.saveSVG();
      return {svg,warnings:imported.warnings.map(w=>w.message)};
    },xml,item.diagram);
    if(result.warnings.length)throw Error(JSON.stringify(result.warnings));
    const name=item.id==='Order'?'pharmacy-order':`bpmn-${item.id.toLowerCase()}`;
    await fs.writeFile(`diagrams/exports/${name}.svg`,result.svg);
    console.log('BPMN exported:',name);
  }
  for(const name of await fs.readdir('diagrams/exports')) {
    if(!name.endsWith('.svg'))continue;
    const svg=await fs.readFile(`diagrams/exports/${name}`,'utf8');
    const dimensions=await page.evaluate(svg=>{
      document.body.innerHTML=svg;const s=document.querySelector('svg');const box=s.viewBox.baseVal;
      let w=box.width||parseFloat(s.getAttribute('width')),h=box.height||parseFloat(s.getAttribute('height'));
      const scale=Math.min(1.5,12000/Math.max(w,h));w=Math.ceil(w*scale);h=Math.ceil(h*scale);
      s.style.maxWidth='none';s.style.maxHeight='none';s.style.width=w+'px';s.style.height=h+'px';s.style.display='block';s.style.background='white';return {w,h};
    },svg);
    await page.setViewport({width:dimensions.w,height:dimensions.h,deviceScaleFactor:1});
    await page.screenshot({path:`diagrams/exports/${name.replace('.svg','.png')}`,fullPage:true});
  }
} finally {await browser.close();}
