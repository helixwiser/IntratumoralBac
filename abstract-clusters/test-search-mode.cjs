// Functional regression checks without browser automation.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),theme=fs.readFileSync('theme.css','utf8');
const elements=new Map();
const context2d={setTransform(){},fillRect(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},strokeRect(){}};
function element(){return {value:'',hidden:false,innerHTML:'',textContent:'',style:{},dataset:{},parentElement:{clientWidth:650},getContext(){return context2d;},setAttribute(){},querySelectorAll(){return [];},focus(){}};}
for(const [,id]of html.matchAll(/id="([^"]+)"/g))elements.set('#'+id,element());
for(const selector of ['.analysis-pair','.actions-section','.matrix-stage','.table-scroll'])elements.set(selector,element());
const document={querySelector(s){assert(elements.has(s),'Missing element '+s);return elements.get(s);},querySelectorAll(){return [];},createElement(){return element();},documentElement:{}};
const sandbox={window:{},document,console,atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array,DataView,ResizeObserver:class{observe(){}},getComputedStyle(){return {getPropertyValue(name){return theme.match(new RegExp(name+':\\s*(#[0-9a-f]{6})'))?.[1]||'';}}}};
vm.createContext(sandbox);
for(const file of ['payload.js','framework-data.js','atlas-search.js','feature-stats.js','atlas.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const S=sandbox.window.AtlasSearch,D=sandbox.window.ABSTRACT_MAP,n=D.papers.length,bytes=Buffer.from(D.matrix,'base64'),sim=(a,b)=>bytes.readInt16LE((a*n+b)*2)/10000;
const fixture=[0,1,2,3,4].map(i=>({id:String(i)}));
assert.deepEqual(Array.from(S.related(fixture,0,(_,i)=>[1,.7,.7001,.8,.69][i]),r=>r.index),[0,3,2]);
assert(!document.querySelector('.analysis-pair').hidden);
let source=0,expected=[];
for(let i=0;i<n;i++){const r=S.related(D.papers,i,sim);if(r.length>expected.length){source=i;expected=r;}}
const search=document.querySelector('#search');search.value=D.papers[source].doi||D.papers[source].id;search.oninput();
assert(document.querySelector('.analysis-pair').hidden);
assert(!document.querySelector('.actions-section').hidden);
assert.equal((document.querySelector('#neighbors').innerHTML.match(/class="related-row"/g)||[]).length,expected.length);
assert.equal((document.querySelector('#table-body').innerHTML.match(/<tr>/g)||[]).length,expected.length);
assert(document.querySelector('#table-body').innerHTML.includes(D.papers[source].id));
assert(expected.length>3,'Real-data fixture should exercise uncapped results');
search.value='zzzzz-not-indexed';search.oninput();
assert(document.querySelector('.analysis-pair').hidden);
assert(document.querySelector('.actions-section').hidden);
assert(document.querySelector('#neighbors').innerHTML.includes('No matching paper'));
search.value='';search.oninput();
assert(!document.querySelector('.analysis-pair').hidden);
assert(!document.querySelector('.actions-section').hidden);
assert(document.querySelector('#neighbors').hidden);
assert.equal((document.querySelector('#table-body').innerHTML.match(/<tr>/g)||[]).length,20);
console.log(`PASS: strict >0.7 boundary; ${expected.length} real related papers in both lists; self included; no-match state; clearing restores charts.`);
