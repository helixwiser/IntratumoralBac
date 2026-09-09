const SNAPSHOT_DATE='2026-09-09';
const organNames={'乳腺':'Breast','肝脏':'Liver','肺':'Lung','胃':'Stomach','结直肠':'Colorectal'};
const collections=['Breast','Liver','Lung','Stomach'];
const colors={Breast:'#b83b35',Liver:'#b58a36',Lung:'#277b88',Stomach:'#7566a5',Colorectal:'#5e7d4c'};
const focusNotes={
  'ITB-000156':'Intratumoral Fusobacterium nucleatum recruits tumour-associated neutrophils and supports immune escape in gastric cancer.',
  'ITB-000078':'Spatial meta-transcriptomics connects bacterial burden with distinct oncogenic signatures in lung cancer cells.',
  'ITB-000048':'Gut-to-liver translocation of Klebsiella pneumoniae promotes hepatocellular carcinoma in mice.'
};
const all=window.PAPERS.map(p=>({...p,organ:organNames[p.organ]||p.organ,short:p.title,summary:focusNotes[p.id]||'',review:'Full-text assessment is pending, including contamination controls, localization, independent validation and causal evidence.'}));
let organ='All',limit=8;
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const selected=()=>all.filter(paper=>organ==='All'||paper.organ===organ);
const short=paper=>paper.short||paper.title;
const citations=paper=>Number.isFinite(paper.citations)?paper.citations.toLocaleString('en-US'):'—';
const jifLabel=paper=>Number.isFinite(paper.jif)?paper.jif.toFixed(1):'Unavailable';
const pointRadius=paper=>Number.isFinite(paper.jif)?2*Math.sqrt(paper.jif):4;
const button=paper=>'<button class="paper-open" data-id="'+paper.id+'">'+esc(short(paper))+'</button>';
const attention=paper=>(Number.isFinite(paper.articleAccesses)?'<a class="access-count" href="'+esc(paper.articleAccessesSource)+'" target="_blank" rel="noopener"><b>'+paper.articleAccesses.toLocaleString('en-US')+'</b><span>Article Accesses</span></a>':'')+'<span class="citation-count"><b>'+citations(paper)+'</b><span>Citations</span></span>';

function detail(id){
  const paper=all.find(item=>item.id===id);
  const summary=paper.summary||'A basic record is available. Detailed interpretation is pending.';
  const citationDate=paper.citationCheckedOn||'2026-09-09';
  $('#detail').innerHTML='<span class="eyebrow">'+esc(paper.organ)+' / '+paper.year+' / '+esc(paper.id)+'</span><h2>'+esc(paper.title)+'</h2><p class="meta">'+esc(paper.author)+' · '+esc(paper.journal)+'</p><p>'+esc(summary)+'</p>'+(Number.isFinite(paper.articleAccesses)?'<p class="small">Article accesses: <a href="'+esc(paper.articleAccessesSource)+'" target="_blank" rel="noopener">'+paper.articleAccesses.toLocaleString('en-US')+' ↗</a> · Publisher page, checked '+esc(paper.articleAccessesCheckedOn)+'</p>':'')+'<p class="small">Citations: '+citations(paper)+' · OpenAlex, checked '+esc(citationDate)+'</p><p class="small">2025 Journal Impact Factor: '+jifLabel(paper)+' (released 2026) · '+(paper.jif===null?'No verified value':'<a href="'+esc(paper.jifSource)+'" target="_blank" rel="noopener">Source ↗</a>')+'</p><hr><p><b>Technical rigor</b>　Full-text assessment pending</p><p><b>Conceptual novelty</b>　Full-text assessment pending</p><p class="small">'+esc(paper.review)+'</p>'+(paper.doi?'<a class="doi" target="_blank" rel="noopener" href="https://doi.org/'+encodeURIComponent(paper.doi)+'">Read the paper ↗</a>':'');
  $('#paper-dialog').showModal();
}

function render(){
  const papers=selected().sort((a,b)=>(b.year-a.year)||b.id.localeCompare(a.id));
  const cited=papers.filter(paper=>Number.isFinite(paper.citations));
  $('#inventory').textContent=all.length+' records · '+collections.length+' organ collections';
  $('#selection-label').textContent=(organ==='All'?'All organs':organ)+' · '+papers.length+' papers';
  document.querySelectorAll('nav button').forEach(button=>{const active=button.dataset.organ===organ;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const preferred=['ITB-000156','ITB-000078','ITB-000048'];
  const focus=preferred.map(id=>papers.find(paper=>paper.id===id)).filter(Boolean);
  for(const paper of [...papers].sort((a,b)=>(b.citations??0)-(a.citations??0))){
    if(focus.length>=3)break;
    if(!focus.includes(paper))focus.push(paper);
  }
  $('#focus').innerHTML=focus.map(paper=>'<article class="focus-item"><span class="eyebrow">'+esc(paper.organ)+' · '+esc(paper.journal)+'</span><h3>'+button(paper)+'</h3><p class="summary">'+esc(paper.summary||'Explore the study design and its central research question.')+'</p><span class="meta">'+esc(paper.author)+' / '+paper.year+'<br>Citations: '+citations(paper)+' · Basic record</span></article>').join('');
  $('#recent').innerHTML=papers.slice(0,6).map(paper=>'<article class="recent-item"><div class="meta">'+paper.year+' · '+esc(paper.organ)+' / '+esc(paper.author)+'</div><h3>'+button(paper)+'</h3></article>').join('');
  $('#papers').innerHTML=papers.slice(0,limit).map(paper=>'<tr><td>'+paper.year+'<br><span class="small">'+esc(paper.organ)+'</span></td><td>'+button(paper)+'</td><td>'+esc(paper.journal)+'<br><span class="small">2025 JIF: '+jifLabel(paper)+'</span></td><td>'+attention(paper)+'</td><td>Basic record</td></tr>').join('');
  $('#more').hidden=limit>=papers.length;
  chart('chart-high',cited.filter(paper=>paper.citations>500),500,Math.max(600,Math.ceil(Math.max(...cited.filter(paper=>paper.citations>500).map(paper=>paper.citations),500)/100)*100));
  chart('chart-mid',cited.filter(paper=>paper.citations>=100&&paper.citations<=500),100,500);
  chart('chart-low',cited.filter(paper=>paper.citations<100),0,100);
}

function chart(id,data,floor,ceiling){
  if(id==='chart-low'){
    chartMonthly(id,data.filter(paper=>paper.publishedOn>='2025-01-01'&&paper.publishedOn<=SNAPSHOT_DATE));
    return;
  }
  const min=Math.min(2009,...all.map(paper=>paper.year)),max=2026,range=Math.max(1,ceiling-floor);
  let html='';
  for(let index=0;index<=4;index++){const y=145-index*30,value=floor+range*index/4;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+Math.round(value)+'</text>';}
  for(let year=min;year<=max;year+=2){const x=75+(year-min)/(max-min)*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+year+'</text>';}
  if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No records in this citation band</text>';
  data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach((paper,index)=>{const x=75+(paper.year-min)/(max-min)*635+(index%5-2)*3;const y=145-(paper.citations-floor)/range*120;const label=paper.author+' '+paper.year+' · '+paper.citations+' citations · 2025 JIF: '+jifLabel(paper);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(paper)+'; '+label)+'" data-id="'+paper.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(paper)+'" fill="'+(Number.isFinite(paper.jif)?colors[paper.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';});
  $('#'+id).innerHTML=html;
}

function chartMonthly(id,data){
  const start=Date.UTC(2025,0,1),end=Date.parse(SNAPSHOT_DATE+'T00:00:00Z'),range=end-start,monthLabels={0:'Jan',3:'Apr',6:'Jul',9:'Oct'};
  let html='';
  for(let index=0;index<=4;index++){const y=145-index*30,value=index*25;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+value+'</text>';}
  for(let year=2025;year<=2026;year++)for(let month=0;month<12;month+=3){const date=Date.UTC(year,month,1);if(date<start||date>end)continue;const x=75+(date-start)/range*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+monthLabels[month]+' '+String(year).slice(2)+'</text>';}
  if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No dated records since January 2025</text>';
  data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach((paper,index)=>{const date=Date.parse(paper.publishedOn+'T00:00:00Z');const x=75+(date-start)/range*635+(index%5-2)*3;const y=145-paper.citations/100*120;const label=paper.author+' · '+paper.publishedOn+' · '+paper.citations+' citations · 2025 JIF: '+jifLabel(paper);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(paper)+'; '+label)+'" data-id="'+paper.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(paper)+'" fill="'+(Number.isFinite(paper.jif)?colors[paper.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';});
  $('#'+id).innerHTML=html;
}

function renderLegend(){
  $('.legend').innerHTML=collections.map(name=>'<span><i style="background:'+colors[name]+'"></i>'+name+'</span>').join('');
  $('.chart-panel p.small').textContent='Landmark and Established: publication year. Emerging: publication month from January 2025. Y: citations. Circle area: 2025 Journal Impact Factor. Altmetric Attention Scores are supplied live by Altmetric.com.';
  $('#chart-low').previousElementSibling.querySelector('span').textContent='<100 citations · monthly from 2025';
  $('#chart-low').setAttribute('aria-label','Emerging papers since 2025, plotted by publication month and citation count');
}

function renderJournalMetrics(){
  const rows=window.JOURNAL_METRICS.journals.map(row=>({...row,paper_count:all.filter(paper=>paper.journal===row.journal).length})).filter(row=>row.paper_count>0);
  const covered=all.filter(paper=>Number.isFinite(paper.jif)).length;
  $('#jif-coverage').textContent=covered+' of '+all.length+' papers';
  $('#journal-table').innerHTML=rows.sort((a,b)=>b.paper_count-a.paper_count||a.journal.localeCompare(b.journal)).map(row=>'<tr><td>'+esc(row.journal)+'</td><td>'+row.paper_count+'</td><td>'+(row.jif_2025===null?'Unavailable':row.jif_2025.toFixed(1))+'</td><td>'+esc(row.status==='verified_publisher'?'Publisher verified':row.status==='reported_secondary'?'Institutional JCR table':'Not verified')+'</td><td><a href="'+esc(row.source_url)+'" target="_blank" rel="noopener">Source ↗</a></td></tr>').join('');
}

function renderOrganTaxa(){
  const groups=collections.map(name=>{const counts={};all.filter(paper=>paper.organ===name).forEach(paper=>(paper.taxa||[]).forEach(taxon=>counts[taxon]=(counts[taxon]||0)+1));const taxa=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));return '<section class="taxa-group"><h4>'+name+' <span>'+taxa.length+' named taxa</span></h4>'+(!taxa.length?'<p class="small">No taxon-level annotation yet.</p>':'<ul>'+taxa.map(([taxon,count])=>'<li><i>'+esc(taxon.replaceAll('_',' '))+'</i><b>'+count+'</b><small>papers</small></li>').join('')+'</ul>')+'</section>';}).join('');
  $('.reading-note').innerHTML='<span class="eyebrow">BACTERIA STUDIED</span><h3>Named taxa,<br>by organ.</h3><p class="small">Counts reflect papers that explicitly name a bacterial taxon in the current card.</p><div class="taxa-groups">'+groups+'</div>';
}

function addAltmetricBadges(){
  document.querySelectorAll('#papers tr').forEach(row=>{if(row.querySelector('.altmetric-embed'))return;const id=row.querySelector('[data-id]')?.dataset.id;const paper=all.find(item=>item.id===id);if(!paper?.doi)return;const badge=document.createElement('div');badge.className='altmetric-embed';badge.dataset.doi=paper.doi;badge.dataset.badgeType='donut';badge.dataset.hideNoMentions='true';badge.setAttribute('aria-label','Altmetric Attention Score');row.cells[3].append(badge);});
  setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}

document.addEventListener('click',event=>{const organButton=event.target.closest('[data-organ]');if(organButton){organ=organButton.dataset.organ;limit=8;render();}const paperButton=event.target.closest('[data-id]');if(paperButton)detail(paperButton.dataset.id);});
$('.chart-plots').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.dataset.id){event.preventDefault();detail(event.target.dataset.id);}});
$('.close').onclick=()=>$('#paper-dialog').close();
$('#paper-dialog').addEventListener('click',event=>{if(event.target===$('#paper-dialog'))$('#paper-dialog').close();});
$('#more').onclick=()=>{limit+=12;render();};
new MutationObserver(addAltmetricBadges).observe($('#papers'),{childList:true});
renderLegend();
render();
renderJournalMetrics();
renderOrganTaxa();
addAltmetricBadges();
