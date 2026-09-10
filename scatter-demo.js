const snapshot=Date.UTC(2026,8,9),start=Date.UTC(2025,0,1),span=snapshot-start;
const papers=window.PAPERS.filter(p=>Number.isFinite(p.citations)&&p.citations<100&&p.publishedOn>='2025-01-01'&&p.publishedOn<='2026-09-09'&&Number.isFinite(p.jif)).map(p=>({...p,date:Date.parse(p.publishedOn.length===7?p.publishedOn+'-01':p.publishedOn)})).filter(p=>Number.isFinite(p.date));
const designs=[
  {name:'Soft transparency',tag:'AIRY',copy:'Broad translucent circles let overlaps build naturally into darker clusters.',kind:'soft'},
  {name:'Editorial small dots',tag:'PRECISE',copy:'Compact opaque marks reduce crowding while preserving a firm printed edge.',kind:'small'},
  {name:'Hollow rings',tag:'LIGHT',copy:'Open centers keep gridlines visible and make dense stacks easier to count.',kind:'rings'},
  {name:'Diamond field',tag:'ANGULAR',copy:'A rotated square gives the chart a more analytical, less bubble-like character.',kind:'diamonds'},
  {name:'Halo and core',tag:'FOCUSED',copy:'A tiny dark center identifies position; a pale halo carries JIF magnitude.',kind:'halo'},
  {name:'Evidence shapes',tag:'INFORMATIVE',copy:'Circle, diamond and square distinguish direct, associated and contextual evidence.',kind:'mixed'}
];
const x=p=>50+(p.date-start)/span*525,y=p=>180-Math.max(0,Math.min(100,p.citations))/100*135,r=p=>Math.max(2.1,1.45*Math.sqrt(p.jif));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function axes(){let h='';for(let i=0;i<=4;i++){const yy=180-i*33.75;h+=`<line class="gridline" x1="50" y1="${yy}" x2="575" y2="${yy}"/><text class="axis-label" x="42" y="${yy+3}" text-anchor="end">${i*25}</text>`;}[['Jan 25',start],['Jul 25',Date.UTC(2025,6,1)],['Jan 26',Date.UTC(2026,0,1)],['Jul 26',Date.UTC(2026,6,1)]].forEach(([label,date])=>{h+=`<text class="axis-label" x="${50+(date-start)/span*525}" y="204" text-anchor="middle">${label}</text>`});return h;}
function mark(p,kind){const cx=x(p),cy=y(p),size=r(p),attrs=`class="point" data-id="${p.id}" tabindex="0"`;
  if(kind==='soft')return `<circle ${attrs} cx="${cx}" cy="${cy}" r="${size*1.08}" fill="#596064" fill-opacity=".32" stroke="#202020" stroke-opacity=".45" stroke-width=".65"/>`;
  if(kind==='small')return `<circle ${attrs} cx="${cx}" cy="${cy}" r="${size*.72}" fill="#8f9699" stroke="#202020" stroke-width="1"/>`;
  if(kind==='rings')return `<circle ${attrs} cx="${cx}" cy="${cy}" r="${size}" fill="white" fill-opacity=".3" stroke="#444b4e" stroke-opacity=".68" stroke-width="1.35"/>`;
  if(kind==='diamonds'){const d=size*.9;return `<polygon ${attrs} points="${cx},${cy-d} ${cx+d},${cy} ${cx},${cy+d} ${cx-d},${cy}" fill="#8f9699" fill-opacity=".62" stroke="#202020" stroke-width=".85"/>`;}
  if(kind==='halo')return `<g ${attrs}><circle cx="${cx}" cy="${cy}" r="${size*1.12}" fill="#90989b" fill-opacity=".22"/><circle cx="${cx}" cy="${cy}" r="2.1" fill="#26292a"/></g>`;
  const shape=p.scopeClass==='direct_intratumoral'?'circle':p.scopeClass==='contextual'?'square':'diamond';
  if(shape==='circle')return `<circle ${attrs} cx="${cx}" cy="${cy}" r="${size*.8}" fill="#9ca2a4" fill-opacity=".72" stroke="#202020" stroke-width=".8"/>`;
  const d=size*(shape==='square'?1.05:.82);if(shape==='diamond')return `<polygon ${attrs} points="${cx},${cy-d} ${cx+d},${cy} ${cx},${cy+d} ${cx-d},${cy}" fill="#9ca2a4" fill-opacity=".72" stroke="#202020" stroke-width=".8"/>`;return `<rect ${attrs} x="${cx-d/2}" y="${cy-d/2}" width="${d}" height="${d}" rx="1.2" fill="#9ca2a4" fill-opacity=".72" stroke="#202020" stroke-width=".8"/>`;
}
document.querySelector('#demo-grid').innerHTML=designs.map((d,i)=>`<article class="demo" id="demo-${i+1}"><div class="demo-head"><div><span class="demo-index">0${i+1}</span><h2>${d.name}</h2><p>${d.copy}</p>${d.kind==='halo'?'<a class="variant-link" href="halo-demo.html">Explore halo variations →</a>':''}</div><span class="tag">${d.tag}</span></div><svg class="plot" viewBox="0 0 620 215" role="img" aria-label="${d.name} scatter plot">${axes()}${papers.sort((a,b)=>r(b)-r(a)).map(p=>mark(p,d.kind)).join('')}</svg></article>`).join('');
const tooltip=document.querySelector('#tooltip'),byId=new Map(papers.map(p=>[p.id,p]));
function show(event){const target=event.target.closest('.point');if(!target)return;const p=byId.get(target.dataset.id);tooltip.innerHTML=`<b>${esc(p.title)}</b><span>${esc(p.organ)} · ${p.year} · ${p.citations} citations · 2025 JIF ${p.jif.toFixed(1)}</span>`;tooltip.hidden=false;const box=tooltip.getBoundingClientRect(),left=Math.min(innerWidth-box.width-12,event.clientX+14),top=Math.min(innerHeight-box.height-12,event.clientY+14);tooltip.style.left=Math.max(8,left)+'px';tooltip.style.top=Math.max(8,top)+'px';}
document.addEventListener('pointermove',show);document.addEventListener('pointerout',e=>{if(e.target.closest('.point'))tooltip.hidden=true});document.addEventListener('focusin',e=>{if(e.target.closest('.point')){const b=e.target.getBoundingClientRect();show({target:e.target,clientX:b.left+b.width/2,clientY:b.top})}});document.addEventListener('focusout',()=>tooltip.hidden=true);
