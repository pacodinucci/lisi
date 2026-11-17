const fs = require('node:fs');
const ts = require('typescript');
fs.mkdirSync('src/modules/content', {recursive:true});
const seed = { version:1, texts:{},styles:{},images:{},inserted:[],deleted:[] };
const slots=[];
let counter=0;
function extractText(source, area) {
 const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const edits=[];
 function visit(node) {
  if(ts.isJsxText(node) && node.text.trim()) {
   const value=node.text.replace(/\s+/g,' ').trim();
   const id=area+'.text.'+String(++counter).padStart(3,'0');
   seed.texts[id]=value;
   slots.push({id,label:value.slice(0,65),section:area==='navbar'?'Navegación':area==='footer'?'Pie de página':'Página principal',area,kind:'text',multiline:value.length>85,defaultSize:16});
   edits.push([node.pos,node.end,`<ContentText id="${id}" />`]);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0])) source=source.slice(0,start)+text+source.slice(end);
 return source;
}
let page=fs.readFileSync('src/app/page.tsx','utf8');
page=page.replace('export default function Home()', 'export function SitePage()');
// Extract all static JSX copy without losing emphasis, line breaks or the existing structure.
page=extractText(page,'landing');
for(const name of ['services','principles']) {
 const match=page.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
 const rows=Function('return '+match[1])();
 rows.forEach(([number,title,copy])=>{
  for(const [key,value] of Object.entries({number,title,copy})) {
   const id=`${name}.${number}.${key}`; seed.texts[id]=value;
   slots.push({id,label:`${title}: ${key}`,section:name==='services'?'Servicios':'Cómo trabajo',area:'landing',kind:'text',multiline:key==='copy',defaultSize:key==='title'?28:16});
  }
 });
 const mapStart=page.indexOf(`{${name}.map(`);
 const mapEnd=page.indexOf('</article>)',mapStart);
 let fragment=page.slice(mapStart,mapEnd);
 for(const key of ['number','title','copy']) fragment=fragment.replaceAll(`{${key}}`,`<ContentText id={\`${name}.\${number}.${key}\`} />`);
 page=page.slice(0,mapStart)+fragment+page.slice(mapEnd);
}
const logoRows=Function('return '+page.match(/const clientLogos = (\[[\s\S]*?\n\]) as const/)[1])();
const imgs=[
 ['hero.image','Retrato principal','/hero-lisi.png','Retrato de Lisi González','hero-visual'],
 ['about.image','Retrato sobre Lisi','/references/page-02.png','Lisi González, retrato en blanco y negro','about-photo photo-frame'],
 ['story.image','Arte y organizaciones','/references/page-07.png','Lisi González durante una actividad en IT Patagonia','image-story-photo'],
 ['experience.main','Experiencia IT Patagonia','/experiencia-it-patagonia.png','Lisi González en IT Patagonia','experience-photo-main'],
 ['experience.detail','Experiencia Celomat','/experiencia-celomat.png','Grupo de participantes en Celomat durante una actividad','experience-photo-detail'],
 ['alliance.image','Alianzas','/references/page-12.png','Participantes en una dinámica de integración con los ojos vendados','alliance-photo']
];
for(const [id,label,src,alt,cls] of imgs) {
 seed.images[id]={src,alt,cropX:50,cropY:50,zoom:1,frameShape:'ORIGINAL',frameRounded:false,fitMode:'COVER',frameScale:1,rotation:0};
 slots.push({id,label,section:'Imágenes',area:'landing',kind:'image'});
 const re=new RegExp('<div className="'+cls+'"[^>]*?(?:\\/>|>([\\s\\S]*?)<\\/div>)');
 page=page.replace(re,(_,children)=>`<ContentImage id="${id}" className="${cls}">${children||''}</ContentImage>`);
}
seed.images['hero.logo']={...seed.images['hero.image'],src:'/logo-blanco.png',alt:'Lisi González & co'};
slots.push({id:'hero.logo',label:'Logo principal',section:'Imágenes',area:'landing',kind:'image'});
page=page.replace(/<Image src="\/logo-blanco.png"[^>]+\/>/,'<ContentImage id="hero.logo" image width={1448} height={1086} />');
for(const [slug,label] of logoRows) {
 const id='client.'+slug;
 seed.images[id]={...seed.images['hero.logo'],src:`/assets/logos/clientes/${slug}.png`,alt:label};
 slots.push({id,label:'Logo '+label,section:'Clientes',area:'landing',kind:'image'});
}
page=page.replace(/<Image src=\{`\/assets\/logos\/clientes\/\$\{slug\}.png`\}[^>]+\/>/,'<ContentImage id={`client.${slug}`} image width={220} height={80} decorative={copy === 1} />');
// Safely editable destinations for static anchors.
function links(source,area) {
 return source.replace(/href="([^"]+)"/g,(_,value)=>{
  const id=value.startsWith('mailto:')?'contact.email.href':`${area}.link.${++counter}`;
  if(!seed.texts[id]) {seed.texts[id]=value;slots.push({id,label:'Destino: '+value,section:'Enlaces',area,kind:'link'});}
  return `href={content.texts["${id}"]}`;
 });
}
page=links(page,'landing');
// Keep the original footer structure, expose its copy in the footer editor.
const footerIndex=page.indexOf('<footer');
for(const slot of slots) if(slot.area==='landing' && page.indexOf(`id="${slot.id}"`,footerIndex)>-1) {slot.area='footer';slot.section='Pie de página';}
page=page.replace('import Image from "next/image";','import { useContent, ContentText, ContentImage } from "./render-context";');
page=page.replace('export function SitePage() {','export function SitePage() {\n const content = useContent();');
page='"use client";\n'+page;
fs.writeFileSync('src/modules/content/site-page.tsx',page);
let header=fs.readFileSync('src/components/site-header.tsx','utf8');
header=extractText(header,'navbar');
header=links(header,'navbar');
header=header.replace('export function SiteHeader() {','export function SiteHeader() {\n const content = useContent();');
header=header.replace('const links = [','const links = [');
header=header.replace('{link.label}','<ContentText id={`navbar.${link.href}`} />');
for(const [href,label] of [['#sobre-lisi','Sobre Lisi'],['#servicios','Servicios'],['#experiencias','Experiencias'],['#contacto','Contacto']]) {
 const id='navbar.'+href;seed.texts[id]=label;slots.push({id,label,section:'Navegación',area:'navbar',kind:'text'});
}
header=header.replace('import { useState } from "react";','import { useState } from "react";\nimport { useContent, ContentText } from "@/modules/content/render-context";');
fs.writeFileSync('src/components/site-header.tsx',header);
// Friendly stable alias for the hero description.
const hero=slots.find(s=>s.id.startsWith('landing.text')&&seed.texts[s.id].startsWith('Consultoría creativa que'));
if(hero){const old=hero.id;hero.id='hero.description';seed.texts[hero.id]=seed.texts[old];delete seed.texts[old];page=fs.readFileSync('src/modules/content/site-page.tsx','utf8').replace(`id="${old}"`,'id="hero.description"');fs.writeFileSync('src/modules/content/site-page.tsx',page);}
fs.writeFileSync('src/modules/content/seed.ts','import type { ContentDocument, ContentSlot } from "./model";\nexport const seed: ContentDocument = '+JSON.stringify(seed,null,2)+';\nexport const slots: ContentSlot[] = '+JSON.stringify(slots,null,2)+';\n');
