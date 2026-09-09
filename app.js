const organNames={'乳腺':'Breast','肝脏':'Liver','肺':'Lung'};
const focusNotes={
'ITB-000078':'Spatial meta-transcriptomics connects bacterial burden with distinct oncogenic signatures in lung cancer cells.',
'ITB-000048':'A study of gut-to-liver translocation of Klebsiella pneumoniae and its role in hepatocellular carcinoma.'
};
const all=window.PAPERS.map(p=>({...p,organ:organNames[p.organ]||p.organ,short:p.title,summary:focusNotes[p.id]||'',review:'Full-text review is pending, including contamination controls, localization, independent validation and causal evidence.'}));let organ='All',limit=8;const colors={'Breast':'#b83b35','Liver':'#b58a36','Lung':'#277b88'};const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const selected=()=>all.filter(p=>organ==='All'||p.organ===organ);const short=p=>p.short||p.title;const btn=p=>'<button class="paper-open" data-id="'+p.id+'">'+esc(short(p))+'</button>';const attention=p=>(Number.isFinite(p.articleAccesses)?'<a class="access-count" href="'+esc(p.articleAccessesSource)+'" target="_blank" rel="noopener"><b>'+p.articleAccesses.toLocaleString('en-US')+'</b><span>Article Accesses</span></a>':'')+'<span class="citation-count"><b>'+(p.citations??'—')+'</b><span>Citations</span></span>';
function detail(id){const p=all.find(p=>p.id===id);$('#detail').innerHTML='<span class="eyebrow">'+esc(p.organ)+' / '+p.year+' / '+esc(p.id)+'</span><h2>'+esc(p.title)+'</h2><p class="meta">'+esc(p.author)+' · '+esc(p.journal)+'</p><p>'+esc(p.summary||'Basic record available. Detailed interpretation is pending.')+'</p>'+(Number.isFinite(p.articleAccesses)?'<p class="small">Article accesses: <a href="'+esc(p.articleAccessesSource)+'" target="_blank" rel="noopener">'+p.articleAccesses.toLocaleString('en-US')+' ↗</a> · Publisher page, checked '+esc(p.articleAccessesCheckedOn)+'</p>':'')+'<p class="small">Citations: '+(p.citations??'Unavailable')+' · OpenAlex，9 September 2026</p><p class="small">2025 Journal Impact Factor: '+jifLabel(p)+' (released 2026) · '+(p.jif===null?'No verified value':'<a href="'+esc(p.jifSource)+'" target="_blank" rel="noopener">Source ↗</a>')+'</p><hr><p><b>Technical rigor</b>　Full-text assessment pending</p><p><b>Conceptual novelty</b>　Full-text assessment pending</p><p class="small">'+esc(p.review||'Contamination controls, independent validation and causal evidence remain to be reviewed.')+'</p>'+(p.doi?'<a class="doi" target="_blank" rel="noopener" href="https://doi.org/'+encodeURIComponent(p.doi)+'">Read the paper ↗</a>':'');$('#paper-dialog').showModal()}
function render(){const papers=selected().sort((a,b)=>b.year-a.year||b.id.localeCompare(a.id));const cited=papers.filter(p=>Number.isFinite(p.citations));$('#inventory').textContent=all.length+' records · 3 organ collections';$('#selection-label').textContent=(organ==='All'?'All organs':organ)+' · '+papers.length+' papers';document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.organ===organ);b.setAttribute('aria-pressed',b.dataset.organ===organ)});const preferred=['ITB-000078','ITB-000048'];let focuses=preferred.map(id=>papers.find(p=>p.id===id)).filter(Boolean);for(const p of [...papers].sort((a,b)=>(b.citations??0)-(a.citations??0))){if(focuses.length>=2)break;if(!focuses.includes(p))focuses.push(p)}$('#focus').innerHTML=focuses.map(p=>'<article class="focus-item"><span class="eyebrow">'+esc(p.organ)+' · '+esc(p.journal)+'</span><h3>'+btn(p)+'</h3><p class="summary">'+esc(p.summary||'Explore the study design and its central research question.')+'</p><span class="meta">'+esc(p.author)+' / '+p.year+'<br>Citations: '+(p.citations??'Unavailable')+' · Basic record</span></article>').join('');$('#recent').innerHTML=papers.slice(0,6).map(p=>'<article class="recent-item"><div class="meta">'+p.year+' · '+esc(p.organ)+' / '+esc(p.author)+'</div><h3>'+btn(p)+'</h3></article>').join('');$('#papers').innerHTML=papers.slice(0,limit).map(p=>'<tr><td>'+p.year+'<br><span class="small">'+esc(p.organ)+'</span></td><td><button class="paper-open" data-id="'+p.id+'">'+esc(p.title)+'</button></td><td>'+esc(p.journal)+'<br><span class="small">2025 JIF: '+jifLabel(p)+'</span></td><td>'+attention(p)+'</td><td>Basic record</td></tr>').join('');$('#more').hidden=limit>=papers.length;chart('chart-high',cited.filter(p=>p.citations>500),500,Math.max(600,Math.ceil(Math.max(...cited.filter(p=>p.citations>500).map(p=>p.citations),500)/100)*100));chart('chart-mid',cited.filter(p=>p.citations>=100&&p.citations<=500),100,500);chart('chart-low',cited.filter(p=>p.citations<100),0,100)}
const pointRadius=p=>Number.isFinite(p.jif)?2*Math.sqrt(p.jif):4;
const jifLabel=p=>Number.isFinite(p.jif)?p.jif.toFixed(1):'Unavailable';
function chart(id,data,floor,ceiling){
 const min=Math.min(2014,...all.map(p=>p.year)),max=2026,range=ceiling-floor;let html='';
 for(let i=0;i<=4;i++){let y=145-i*30,value=floor+range*i/4;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+Math.round(value)+'</text>'}
 for(let year=min;year<=max;year+=2){const x=75+(year-min)/(max-min)*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+year+'</text>'}
 if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No records in this citation band</text>';
 data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach((p,i)=>{let x=75+(p.year-min)/(max-min)*635+(i%5-2)*3,y=145-(p.citations-floor)/range*120;
 const available=Number.isFinite(p.jif),label=p.author+' '+p.year+' · '+p.citations+' citations · 2025 JIF: '+jifLabel(p);
 html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(p)+'; '+label)+'" data-id="'+p.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(p)+'" fill="'+(available?colors[p.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';
 });$('#'+id).innerHTML=html;
}
function renderJournalMetrics(){
 const rows=window.JOURNAL_METRICS.journals,available=rows.filter(r=>Number.isFinite(r.jif_2025));
 $('#jif-coverage').textContent=available.length+' of '+rows.length+' journals · '+available.reduce((n,r)=>n+r.paper_count,0)+' of '+all.length+' papers';
 $('#journal-table').innerHTML=rows.map(r=>'<tr><td>'+esc(r.journal)+'</td><td>'+r.paper_count+'</td><td>'+(r.jif_2025===null?'Unavailable':r.jif_2025.toFixed(1))+'</td><td>'+esc(r.status==='verified_publisher'?'Publisher verified':r.status==='reported_secondary'?'Institutional JCR table':'Not verified')+'</td><td><a href="'+esc(r.source_url)+'" target="_blank" rel="noopener">Source ↗</a></td></tr>').join('');
}

document.addEventListener('click',e=>{const o=e.target.closest('[data-organ]');if(o){organ=o.dataset.organ;limit=8;render()}const p=e.target.closest('[data-id]');if(p)detail(p.dataset.id)});$('.chart-plots').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.id){e.preventDefault();detail(e.target.dataset.id)}});$('.close').onclick=()=>$('#paper-dialog').close();$('#paper-dialog').addEventListener('click',e=>{if(e.target===$('#paper-dialog'))$('#paper-dialog').close()});$('#more').onclick=()=>{limit+=12;render()};render();
renderJournalMetrics();

function chart(id,data,floor,ceiling){
 if(id==='chart-low')return chartMonthly(id,data.filter(p=>p.publishedOn>='2025-01-01'));
 const min=Math.min(2014,...all.map(p=>p.year)),max=2026,range=ceiling-floor;let html='';
 for(let i=0;i<=4;i++){let y=145-i*30,value=floor+range*i/4;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+Math.round(value)+'</text>'}
 for(let year=min;year<=max;year+=2){const x=75+(year-min)/(max-min)*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+year+'</text>'}
 if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No records in this citation band</text>';
 data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach((p,i)=>{let x=75+(p.year-min)/(max-min)*635+(i%5-2)*3,y=145-(p.citations-floor)/range*120;const available=Number.isFinite(p.jif),label=p.author+' '+p.year+' · '+p.citations+' citations · 2025 JIF: '+jifLabel(p);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(p)+'; '+label)+'" data-id="'+p.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(p)+'" fill="'+(available?colors[p.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>'});$('#'+id).innerHTML=html;
}
function chartMonthly(id,data){
 const start=Date.UTC(2025,0,1),end=Date.UTC(2026,8,30),range=end-start,monthLabels={0:'Jan',3:'Apr',6:'Jul',9:'Oct'};let html='';
 for(let i=0;i<=4;i++){let y=145-i*30,value=i*25;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+value+'</text>'}
 for(let year=2025;year<=2026;year++)for(let month=0;month<12;month+=3){const date=Date.UTC(year,month,1);if(date<start||date>end)continue;const x=75+(date-start)/range*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+monthLabels[month]+' '+String(year).slice(2)+'</text>'}
 if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No dated records since January 2025</text>';
 data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach((p,i)=>{const date=Date.parse(p.publishedOn+'T00:00:00Z');let x=75+(date-start)/range*635+(i%5-2)*3,y=145-p.citations/100*120;const available=Number.isFinite(p.jif),label=p.author+' · '+p.publishedOn+' · '+p.citations+' citations · 2025 JIF: '+jifLabel(p);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(p)+'; '+label)+'" data-id="'+p.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(p)+'" fill="'+(available?colors[p.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>'});$('#'+id).innerHTML=html;
}
document.querySelector('#chart-low').previousElementSibling.querySelector('span').textContent='<100 citations · monthly from 2025';
document.querySelector('#chart-low').setAttribute('aria-label','Emerging papers since 2025, plotted by publication month and citation count');

function addAltmetricBadges(){
 document.querySelectorAll('#papers tr').forEach(row=>{if(row.querySelector('.altmetric-embed'))return;const id=row.querySelector('[data-id]')?.dataset.id,p=all.find(item=>item.id===id);if(!p?.doi)return;const badge=document.createElement('span');badge.className='altmetric-embed';badge.dataset.doi=p.doi;badge.dataset.badgeType='donut';badge.dataset.hideNoMentions='true';badge.setAttribute('aria-label','Altmetric Attention Score');row.cells[3].append(badge)});
 setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}
new MutationObserver(addAltmetricBadges).observe($('#papers'),{childList:true});
addAltmetricBadges();

function addAltmetricBadges(){
 document.querySelectorAll('#papers tr').forEach(row=>{if(row.querySelector('.altmetric-embed'))return;const id=row.querySelector('[data-id]')?.dataset.id,p=all.find(item=>item.id===id);if(!p?.doi)return;const badge=document.createElement('div');badge.className='altmetric-embed';badge.dataset.doi=p.doi;badge.dataset.badgeType='donut';badge.dataset.hideNoMentions='true';badge.setAttribute('aria-label','Altmetric Attention Score');row.cells[3].append(badge)});
 setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}
document.querySelector('.chart-panel p.small').textContent='Landmark and Established: publication year. Emerging: publication month from January 2025. Y: citations. Circle area: 2025 Journal Impact Factor. Altmetric Attention Scores are supplied live by Altmetric.com.';

function renderOrganCounts(){
 const organs=['Breast','Liver','Lung'],counts=organs.map(name=>({name,count:all.filter(p=>p.organ===name).length}));
 $('.reading-note').innerHTML='<span class="eyebrow">ORGAN COLLECTIONS</span><h3>Intratumoral<br>bacteria research.</h3><p class="small">Papers currently included in each organ collection.</p><div class="organ-counts">'+counts.map(item=>'<div class="organ-count"><span>'+item.name+'</span><b>'+item.count+'</b><small>papers</small></div>').join('')+'</div><p class="small organ-total">'+all.length+' papers across three organs</p>';
}
renderOrganCounts();
