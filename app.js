const SNAPSHOT_DATE='2026-09-09';
const PLOT_START_YEAR=2010;
const organConfig=window.ORGAN_CONFIG||[];
const palette=['#b83b35','#277b88','#b58a36','#7566a5','#5e7d4c','#8a5b43','#3e6f8e','#927b34','#6f5688','#47785d'];
const all=window.PAPERS.map(p=>({...p,short:p.title,review:p.reviewStatus||p.contentStatus||'Review status unavailable'}));
const PAN_CANCER='Pan-cancer';
const OTHERS='Others';
const organPaperCounts=all.reduce((counts,paper)=>{counts[paper.organId]=(counts[paper.organId]||0)+1;return counts;},{});
const atlasOrganRows=organConfig.filter(row=>row.id!=='pan_cancer'&&(organPaperCounts[row.id]||0)>20).sort((a,b)=>(organPaperCounts[b.id]||0)-(organPaperCounts[a.id]||0));
const atlasOrganIds=new Set(atlasOrganRows.map(row=>row.id));
const collections=[...atlasOrganRows.map(row=>row.en),PAN_CANCER,OTHERS];
const colors={...Object.fromEntries(atlasOrganRows.map((row,index)=>[row.en,row.color||palette[index%palette.length]])),[PAN_CANCER]:'#202020',[OTHERS]:'#989898'};
let organ='All',limit=8;
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const collectionForPaper=paper=>paper.organId==='pan_cancer'?PAN_CANCER:atlasOrganIds.has(paper.organId)?paper.organ:OTHERS;
const selected=()=>all.filter(paper=>organ==='All'||collectionForPaper(paper)===organ);
const collectionCount=name=>all.filter(paper=>collectionForPaper(paper)===name).length;
const short=paper=>paper.short||paper.title;
const citations=paper=>Number.isFinite(paper.citations)?paper.citations.toLocaleString('en-US'):'—';
const jifLabel=paper=>Number.isFinite(paper.jif)?paper.jif.toFixed(1):'Unavailable';
const altmetricLabel=paper=>paper.altmetricStatus==='access_required'?'Live badge available; an archived numeric value requires API access':paper.altmetricStatus==='no_doi'?'Unavailable (no DOI)':paper.altmetricStatus||'Unavailable';
const hasVerifiedFullTextReview=paper=>paper.reviewStatus==='verified_full_text'||paper.contentStatus==='verified_full_text';
const focusCopy=paper=>hasVerifiedFullTextReview(paper)?(paper.whyRead||paper.summary):paper.summary;
const pointRadius=paper=>Number.isFinite(paper.jif)?2*Math.sqrt(paper.jif):4;
const button=(paper,context='collection')=>'<button class="paper-open" data-id="'+paper.id+'" data-context="'+context+'">'+esc(short(paper))+'</button>';
const attention=paper=>'<span class="citation-count"><b>'+citations(paper)+'</b><span>Citations</span></span>';
const statusBadge=paper=>paper.publicationStatus==='retracted'?'<span class="status-badge retracted">RETRACTED</span>':paper.publicationVersion==='preprint'?'<span class="status-badge">PREPRINT</span>':'';
const taxonLabel=taxon=>String(taxon||'').replaceAll('_',' ').replace(/\s+/g,' ').trim();
const taxonRanks=taxon=>{
  const label=taxonLabel(taxon);
  const enterotoxigenic=label.match(/^Enterotoxigenic\s+([A-Z][a-z]+)\s+([a-z][a-z-]+)/);
  if(enterotoxigenic)return {genus:enterotoxigenic[1],species:label};
  if(label==='Escherichia Shigella')return {genus:'Escherichia/Shigella group',species:null};
  const species=label.match(/^([A-Z][a-z]+)\s+((?:[a-z][a-z-]+)|sp\.?)\b/);
  if(species)return {genus:species[1],species:label};
  if(/^[A-Z][a-z]+$/.test(label)&&!/(aceae|ales|ota)$/.test(label))return {genus:label,species:null};
  return {genus:null,species:null};
};
const preciseMonthlyDate=paper=>{
  if(!['month','day'].includes(paper.datePrecision))return null;
  const match=String(paper.publishedOn||'').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if(!match)return null;
  return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]||1));
};
const publicationDateParts=paper=>String(paper.publishedOn||paper.publishedOnline||paper.year||'').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
const publicationSortTimestamp=paper=>{
  const match=publicationDateParts(paper),year=Number(paper.year);
  if(!match)return Date.UTC(year||0,0,1);
  const dateYear=Number(match[1]),month=Number(match[2]||1),day=Number(match[3]||1);
  const timestamp=Date.UTC(dateYear,month-1,day);
  if(dateYear!==year||timestamp>Date.parse(SNAPSHOT_DATE+'T23:59:59Z'))return Date.UTC(year,0,1);
  return timestamp;
};
const publicationDateLabel=paper=>{
  const match=publicationDateParts(paper),year=Number(paper.year);
  if(!match)return String(year||'Date unavailable');
  const dateYear=Number(match[1]),month=Number(match[2]||1),day=Number(match[3]||1);
  const timestamp=Date.UTC(dateYear,month-1,day);
  if(dateYear!==year||timestamp>Date.parse(SNAPSHOT_DATE+'T23:59:59Z'))return String(year)+' · exact date under review';
  if(!match[2])return String(dateYear);
  if(!match[3])return new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(timestamp));
  return new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(timestamp));
};

function detail(id,context='collection'){
  const paper=all.find(item=>item.id===id);
  const summary=paper.summary||'A basic metadata record is available; detailed interpretation has not yet been completed.';
  const citationDate=paper.citationCheckedOn||'2026-09-09';
  const assessment=context==='focus'&&hasVerifiedFullTextReview(paper)?'<section class="verified-assessment"><hr><p><b>Technical rigor</b>　'+esc(paper.technicalRigor)+'</p><p><b>Technical innovation</b>　'+esc(paper.technicalInnovation)+'</p><p><b>Conceptual novelty</b>　'+esc(paper.conceptualNovelty)+'</p><p><b>Key limitation</b>　'+esc(paper.keyLimitation)+'</p></section>':'';
  $('#detail').innerHTML='<span class="eyebrow">'+esc(paper.organ)+' / '+paper.year+' / '+esc(paper.id)+'</span>'+statusBadge(paper)+'<h2>'+esc(paper.title)+'</h2><p class="meta">'+esc(paper.author)+' · '+esc(paper.journal)+' · '+esc(paper.scopeClass||'scope unavailable')+' · '+esc(paper.publicationVersion||'version unavailable')+'</p><p class="publication-date"><b>Published</b> '+esc(publicationDateLabel(paper))+'</p><p>'+esc(summary)+'</p>'+(paper.publicationStatus==='retracted'?'<p class="retraction-note"><b>Retraction notice:</b> This record is retained for historical and methodological context. Its original conclusions must not be treated as valid evidence.'+(paper.retractionDoi?' <a href="https://doi.org/'+encodeURIComponent(paper.retractionDoi)+'" target="_blank" rel="noopener">Notice ↗</a>':'')+'</p>':'')+'<p class="small">Citations: '+citations(paper)+' · OpenAlex, checked '+esc(citationDate)+'</p>'+(paper.doi?'<div class="detail-altmetric"><span class="small">Altmetric Attention Score</span><div class="altmetric-embed" data-doi="'+esc(paper.doi)+'" data-badge-type="medium-donut" data-hide-no-mentions="true"></div></div>':'<p class="small">Altmetric Attention Score: '+esc(altmetricLabel(paper))+'</p>')+'<p class="small">2025 Journal Impact Factor: '+jifLabel(paper)+' · '+(paper.jifSource?'<a href="'+esc(paper.jifSource)+'" target="_blank" rel="noopener">Source ↗</a>':'Source unavailable')+'</p>'+assessment+(paper.doi?'<a class="doi" target="_blank" rel="noopener" href="https://doi.org/'+encodeURIComponent(paper.doi)+'">Read the paper ↗</a>':'');
  $('#paper-dialog').showModal();
  setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}

function render(){
  const papers=selected().sort((a,b)=>publicationSortTimestamp(b)-publicationSortTimestamp(a)||b.id.localeCompare(a.id));
  const cited=papers.filter(paper=>Number.isFinite(paper.citations));
  const plottedByYear=cited.filter(paper=>paper.year>=PLOT_START_YEAR);
  $('#inventory').textContent=all.length+' records · '+atlasOrganRows.length+' major organs · 2 grouped views';
  const fullTextCount=all.filter(hasVerifiedFullTextReview).length;
  $('.editor-note .small').textContent=fullTextCount?fullTextCount+' verified full-text assessments available.':'Verified full-text assessments will appear here.';
  $('#selection-label').textContent=(organ==='All'?'All collections':organ)+' · '+papers.length+' papers';
  document.querySelectorAll('nav button').forEach(button=>{const active=button.dataset.organ===organ;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const eligible=papers.filter(p=>p.publicationStatus!=='retracted');
  const preferred=eligible.filter(p=>p.selectionReason).sort((a,b)=>(b.citations??-1)-(a.citations??-1)).slice(0,3).map(p=>p.id);
  const focus=preferred.map(id=>papers.find(paper=>paper.id===id)).filter(Boolean);
  for(const paper of [...eligible].sort((a,b)=>(b.citations??0)-(a.citations??0))){
    if(focus.length>=3)break;
    if(!focus.includes(paper))focus.push(paper);
  }
  $('#focus').innerHTML=focus.map(paper=>'<article class="focus-item"><span class="eyebrow">'+esc(paper.organ)+' · '+esc(paper.journal)+'</span><h3>'+button(paper,'focus')+'</h3><p class="summary">'+esc(focusCopy(paper)||'Explore the study design and its central research question.')+'</p><span class="meta">'+esc(paper.author)+' / '+paper.year+'<br>Citations: '+citations(paper)+(hasVerifiedFullTextReview(paper)?' · Full-text review available':'')+'</span></article>').join('');
  $('#recent').innerHTML=papers.slice(0,6).map(paper=>'<article class="recent-item"><div class="meta">'+paper.year+' · '+esc(paper.organ)+' / '+esc(paper.author)+'</div><h3>'+button(paper)+'</h3></article>').join('');
  $('#papers').innerHTML=papers.slice(0,limit).map(paper=>'<tr><td>'+paper.year+'<br><span class="small">'+esc(paper.organ)+'</span></td><td>'+statusBadge(paper)+button(paper)+'</td><td>'+esc(paper.journal)+'<br><span class="small">2025 JIF: '+jifLabel(paper)+'</span></td><td>'+attention(paper)+'</td></tr>').join('');
  $('#more').hidden=limit>=papers.length;
  chart('chart-high',plottedByYear.filter(paper=>paper.citations>500),500,Math.max(600,Math.ceil(Math.max(...plottedByYear.filter(paper=>paper.citations>500).map(paper=>paper.citations),500)/100)*100));
  chart('chart-mid',plottedByYear.filter(paper=>paper.citations>=100&&paper.citations<=500),100,500);
  chart('chart-low',cited.filter(paper=>paper.citations<100),0,100);
  const lowCited=cited.filter(paper=>paper.citations<100);
  const monthly=lowCited.filter(paper=>{const date=preciseMonthlyDate(paper);return date!==null&&date>=Date.UTC(2025,0,1)&&date<=Date.parse(SNAPSHOT_DATE+'T00:00:00Z');});
  let plotCoverage=$('#plot-coverage');
  if(!plotCoverage){plotCoverage=document.createElement('p');plotCoverage.id='plot-coverage';plotCoverage.className='small';$('.chart-panel').append(plotCoverage);}
  const annualCount=plottedByYear.filter(paper=>paper.citations>=100).length;
  const pre2010Count=cited.filter(paper=>paper.year<PLOT_START_YEAR).length;
  plotCoverage.textContent=(annualCount+monthly.length)+' papers shown: '+annualCount+' established or landmark papers since 2010, and '+monthly.length+' recent papers in the monthly Emerging panel. '+pre2010Count+' cited papers published before 2010 remain in the collection table.';
  renderOrganTaxa();
}

function chart(id,data,floor,ceiling){
  if(id==='chart-low'){
    chartMonthly(id,data.filter(paper=>paper.publishedOn>='2025-01-01'&&paper.publishedOn<=SNAPSHOT_DATE));
    return;
  }
  const min=PLOT_START_YEAR,max=Math.max(...all.map(paper=>paper.year)),range=Math.max(1,ceiling-floor);
  let html='';
  for(let index=0;index<=4;index++){const y=145-index*30,value=floor+range*index/4;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+Math.round(value)+'</text>';}
  for(let year=min;year<=max;year+=2){const x=75+(year-min)/(max-min)*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+year+'</text>';}
  if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No records in this citation band</text>';
  data.sort((a,b)=>(b.jif??0)-(a.jif??0)).forEach(paper=>{const x=75+(paper.year-min)/Math.max(1,max-min)*635;const y=145-(paper.citations-floor)/range*120;const category=collectionForPaper(paper);const label=category+' · '+paper.author+' '+paper.year+' · '+paper.citations+' citations · 2025 JIF: '+jifLabel(paper);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(paper)+'; '+label)+'" data-id="'+paper.id+'" data-context="collection" cx="'+x+'" cy="'+y+'" r="'+pointRadius(paper)+'" fill="'+(Number.isFinite(paper.jif)?colors[category]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';});
  $('#'+id).innerHTML=html;
}

function chartMonthly(id,data){
  const start=Date.UTC(2025,0,1),end=Date.parse(SNAPSHOT_DATE+'T00:00:00Z'),range=end-start,monthLabels={0:'Jan',3:'Apr',6:'Jul',9:'Oct'};
  data=data.map(paper=>({paper,date:preciseMonthlyDate(paper)})).filter(item=>item.date!==null&&item.date>=start&&item.date<=end);
  let html='';
  for(let index=0;index<=4;index++){const y=145-index*30,value=index*25;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+value+'</text>';}
  for(let year=2025;year<=2026;year++)for(let month=0;month<12;month+=3){const date=Date.UTC(year,month,1);if(date<start||date>end)continue;const x=75+(date-start)/range*635;html+='<text x="'+x+'" y="174" text-anchor="middle">'+monthLabels[month]+' '+String(year).slice(2)+'</text>';}
  if(!data.length)html+='<text x="395" y="88" text-anchor="middle">No dated records since January 2025</text>';
  data.sort((a,b)=>(b.paper.jif??0)-(a.paper.jif??0)).forEach(({paper,date})=>{const x=75+(date-start)/range*635;const y=145-paper.citations/100*120;const category=collectionForPaper(paper);const label=category+' · '+paper.author+' · '+paper.publishedOn+' · '+paper.citations+' citations · 2025 JIF: '+jifLabel(paper);html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(paper)+'; '+label)+'" data-id="'+paper.id+'" data-context="collection" cx="'+x+'" cy="'+y+'" r="'+pointRadius(paper)+'" fill="'+(Number.isFinite(paper.jif)?colors[category]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';});
  $('#'+id).innerHTML=html;
}

function renderLegend(){
  $('.legend').innerHTML=collections.map(name=>'<span><i style="background:'+colors[name]+'"></i>'+name+'</span>').join('');
  $('.chart-panel p.small').textContent='Landmark and Established: publication year from 2010. Emerging: publication month from January 2025. Y: citations. Circle area: 2025 Journal Impact Factor. Colors use the atlas collections: organs with more than 20 papers, Pan-cancer, and Others. Altmetric Attention Scores are supplied live by Altmetric.com.';
  $('#chart-low').previousElementSibling.querySelector('span').textContent='<100 citations · monthly from 2025';
  $('#chart-low').setAttribute('aria-label','Emerging papers since 2025, plotted by publication month and citation count');
}

function renderNavigation(){
  $('.nav-left').innerHTML='<button class="active" data-organ="All">Overview</button>'+collections.map(name=>'<button data-organ="'+esc(name)+'">'+esc(name)+'</button>').join('');
  const map=$('.body-map');
  map.querySelectorAll('.organ-dot').forEach(node=>node.remove());
  atlasOrganRows.filter(row=>row.hotspot).forEach(row=>{const count=organPaperCounts[row.id]||0;const node=document.createElement('button');node.className='organ-dot';node.dataset.organ=row.en;node.setAttribute('aria-label','Explore '+row.en+' research, '+count+' papers');node.style.left=row.hotspot.x+'%';node.style.top=row.hotspot.y+'%';node.style.background=colors[row.en];node.innerHTML='<span>'+esc(row.en)+'<small>'+count+' papers</small></span>';map.append(node);});
  $('#atlas-count').textContent=String(atlasOrganRows.length).padStart(2,'0')+' ORGANS · 02 GROUPED';
  $('#atlas-groups').innerHTML=[PAN_CANCER,OTHERS].map(name=>'<button data-organ="'+name+'"><span>'+(name===PAN_CANCER?'CROSS-ORGAN EVIDENCE':'LOWER-VOLUME ORGANS')+'</span><b>'+name+'</b><small>'+collectionCount(name)+' papers</small></button>').join('');
}

function renderJournalMetrics(){
  const rows=window.JOURNAL_METRICS.journals.map(row=>({...row,paper_count:all.filter(paper=>paper.journal===row.journal).length})).filter(row=>row.paper_count>0&&Number.isFinite(row.jif_2025));
  const covered=all.filter(paper=>Number.isFinite(paper.jif)).length;
  $('#jif-coverage').textContent=covered+' of '+all.length+' papers';
  $('#journal-table').innerHTML=rows.sort((a,b)=>b.paper_count-a.paper_count||a.journal.localeCompare(b.journal)).map(row=>'<tr><td>'+esc(row.journal)+'</td><td>'+row.paper_count+'</td><td>'+row.jif_2025.toFixed(1)+'</td><td>'+esc(row.status==='verified_publisher'?'Publisher verified':'Institutional JCR table')+'</td><td>'+(row.source_url?'<a href="'+esc(row.source_url)+'" target="_blank" rel="noopener">Source ↗</a>':'—')+'</td></tr>').join('');
}

function renderOrganTaxa(){
  const panel=$('.reading-note');
  if(organ==='All'){
    const counts=collections.map(name=>[name,collectionCount(name)]);
    panel.innerHTML='<span class="eyebrow">COLLECTION COVERAGE</span><h3>Papers,<br>by organ.</h3><p class="small">Organs with more than 20 papers have individual collections. Pan-cancer remains separate; lower-volume organs are grouped as Others.</p><ul class="organ-counts">'+counts.map(([name,count])=>'<li><button data-organ="'+esc(name)+'"><span>'+esc(name)+'</span><b>'+count+'</b><small>'+(count===1?'paper':'papers')+'</small></button></li>').join('')+'</ul>';
    return;
  }
  const genusCounts={},speciesCounts={};
  selected().forEach(paper=>{
    const paperGenera=new Set(),paperSpecies=new Set();
    (paper.taxa||[]).forEach(taxon=>{const ranks=taxonRanks(taxon);if(ranks.genus)paperGenera.add(ranks.genus);if(ranks.species)paperSpecies.add(ranks.species);});
    paperGenera.forEach(name=>genusCounts[name]=(genusCounts[name]||0)+1);
    paperSpecies.forEach(name=>speciesCounts[name]=(speciesCounts[name]||0)+1);
  });
  const sorted=counts=>Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const rankList=(title,rows)=>'<section class="taxa-rank"><h4>'+title+' <span>'+rows.length+' named taxa</span></h4>'+(!rows.length?'<p class="small">No '+title.toLowerCase()+' annotation yet.</p>':'<ul>'+rows.map(([taxon,count])=>'<li><i>'+esc(taxon)+'</i><b>'+count+'</b><small>'+(count===1?'paper':'papers')+'</small></li>').join('')+'</ul>')+'</section>';
  const othersBreakdown=organ===OTHERS?Object.entries(all.filter(paper=>collectionForPaper(paper)===OTHERS).reduce((counts,paper)=>{counts[paper.organ]=(counts[paper.organ]||0)+1;return counts;},{})).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])):[];
  const members=organ===OTHERS?'<details class="others-members"><summary>'+othersBreakdown.length+' organ collections in Others</summary><ul>'+othersBreakdown.map(([name,count])=>'<li><span>'+esc(name)+'</span><b>'+count+'</b></li>').join('')+'</ul></details>':'';
  panel.innerHTML='<span class="eyebrow">'+esc((organ===OTHERS?'OTHER ORGANS':organ).toUpperCase())+' BACTERIA</span><h3>Named taxa.</h3><p class="small">Genus counts aggregate explicit genus and species mentions once per paper. Species counts retain explicitly named species or strains.</p>'+members+'<div class="taxa-groups">'+rankList('Genus level',sorted(genusCounts))+rankList('Species level',sorted(speciesCounts))+'</div>';
}

function addAltmetricBadges(){
  document.querySelectorAll('#papers tr').forEach(row=>{if(row.querySelector('.altmetric-embed'))return;const id=row.querySelector('[data-id]')?.dataset.id;const paper=all.find(item=>item.id===id);if(!paper?.doi)return;const badge=document.createElement('div');badge.className='altmetric-embed';badge.dataset.doi=paper.doi;badge.dataset.badgeType='donut';badge.dataset.hideNoMentions='true';badge.setAttribute('aria-label','Altmetric Attention Score');row.cells[3].append(badge);});
  setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}

document.addEventListener('click',event=>{const organButton=event.target.closest('[data-organ]');if(organButton){organ=organButton.dataset.organ;limit=8;render();}const paperButton=event.target.closest('[data-id]');if(paperButton)detail(paperButton.dataset.id,paperButton.dataset.context||'collection');});
$('.chart-plots').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.dataset.id){event.preventDefault();detail(event.target.dataset.id,event.target.dataset.context||'collection');}});
$('.close').onclick=()=>$('#paper-dialog').close();
$('#paper-dialog').addEventListener('click',event=>{if(event.target===$('#paper-dialog'))$('#paper-dialog').close();});
$('#more').onclick=()=>{limit+=12;render();};
new MutationObserver(addAltmetricBadges).observe($('#papers'),{childList:true});
renderNavigation();
renderLegend();
render();
renderJournalMetrics();
addAltmetricBadges();
