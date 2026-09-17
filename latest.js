const SNAPSHOT_DATE=window.DATA_BUILT_ON||'2026-09-09';
const papers=window.PAPERS||[];
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const citations=paper=>Number.isFinite(paper.citations)?paper.citations.toLocaleString('en-US'):'—';
const jifLabel=paper=>Number.isFinite(paper.jif)?paper.jif.toFixed(1):'Unavailable';
const statusBadge=paper=>paper.publicationStatus==='retracted'?'<span class="status-badge retracted">RETRACTED</span>':paper.publicationVersion==='preprint'?'<span class="status-badge">PREPRINT</span>':'';
const publicationDateParts=paper=>String(paper.publishedOn||paper.publishedOnline||paper.year||'').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
const publicationSortTimestamp=paper=>{
  const match=publicationDateParts(paper),year=Number(paper.year);
  if(!match)return Date.UTC(year||0,0,1);
  const dateYear=Number(match[1]),month=Number(match[2]||1),day=Number(match[3]||1),timestamp=Date.UTC(dateYear,month-1,day);
  if(dateYear!==year||timestamp>Date.parse(SNAPSHOT_DATE+'T23:59:59Z'))return Date.UTC(year,0,1);
  return timestamp;
};
const publicationDateLabel=paper=>{
  const match=publicationDateParts(paper),year=Number(paper.year);
  if(!match)return String(year||'Date unavailable');
  const dateYear=Number(match[1]),month=Number(match[2]||1),day=Number(match[3]||1),timestamp=Date.UTC(dateYear,month-1,day);
  if(dateYear!==year||timestamp>Date.parse(SNAPSHOT_DATE+'T23:59:59Z'))return String(year)+' · exact date under review';
  if(!match[2])return String(dateYear);
  if(!match[3])return new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(timestamp));
  return new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(timestamp));
};
const ordered=[...papers].sort((a,b)=>publicationSortTimestamp(b)-publicationSortTimestamp(a)||b.id.localeCompare(a.id));
let limit=30;

function attention(paper){
  return '<span class="citation-count"><b>'+citations(paper)+'</b><span>Citations</span></span>'+(paper.doi?'<div class="altmetric-embed" data-doi="'+esc(paper.doi)+'" data-badge-type="donut" data-hide-no-mentions="true"></div>':'');
}

function detail(id){
  const paper=papers.find(item=>item.id===id),abstractText=String(paper.abstract||'').trim();
  const abstractHtml=abstractText?'<section class="paper-abstract"><span class="eyebrow">ABSTRACT</span><p>'+esc(abstractText)+'</p>'+(paper.abstractSourceUrl?'<p class="small">Source: <a href="'+esc(paper.abstractSourceUrl)+'" target="_blank" rel="noopener">'+esc(paper.abstractSource||'Original record')+' ↗</a></p>':'')+'</section>':'<section class="paper-abstract"><span class="eyebrow">ABSTRACT</span><p class="small">Original abstract unavailable from the indexed sources currently recorded for this paper.</p></section>';
  $('#detail').innerHTML='<span class="eyebrow">'+esc(paper.organ)+' / '+paper.year+' / '+esc(paper.id)+'</span>'+statusBadge(paper)+'<h2>'+esc(paper.title)+'</h2><p class="meta">'+esc(paper.author)+' · '+esc(paper.journal)+' · '+esc(paper.scopeClass||'scope unavailable')+' · '+esc(paper.publicationVersion||'version unavailable')+'</p><p class="publication-date"><b>Published</b> '+esc(publicationDateLabel(paper))+'</p>'+abstractHtml+(paper.publicationStatus==='retracted'?'<p class="retraction-note"><b>Retraction notice:</b> This record is retained for historical and methodological context. Its original conclusions must not be treated as valid evidence.</p>':'')+'<p class="small">Citations: '+citations(paper)+' · OpenAlex, checked '+esc(paper.citationCheckedOn||SNAPSHOT_DATE)+'</p>'+(paper.doi?'<div class="detail-altmetric"><span class="small">Altmetric Attention Score</span><div class="altmetric-embed" data-doi="'+esc(paper.doi)+'" data-badge-type="medium-donut" data-hide-no-mentions="true"></div></div>':'')+'<p class="small">2025 Journal Impact Factor: '+jifLabel(paper)+'</p>'+(paper.doi?'<a class="doi" target="_blank" rel="noopener" href="https://doi.org/'+encodeURIComponent(paper.doi)+'">Read the paper ↗</a>':'');
  $('#paper-dialog').showModal();
  setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}

function render(){
  $('#latest-count').textContent=ordered.length+' papers · '+ordered.filter(paper=>paper.year===2026).length+' published in 2026';
  $('#latest-papers').innerHTML=ordered.slice(0,limit).map(paper=>'<tr><td><span class="paper-date">'+esc(publicationDateLabel(paper))+'</span><br><span class="small">'+esc(paper.organ)+'</span></td><td>'+statusBadge(paper)+'<button class="paper-open" data-id="'+esc(paper.id)+'">'+esc(paper.title)+'</button></td><td>'+esc(paper.journal)+'<br><span class="small">2025 JIF: '+jifLabel(paper)+'</span></td><td>'+attention(paper)+'</td></tr>').join('');
  $('#latest-more').hidden=limit>=ordered.length;
  setTimeout(()=>window._altmetric_embed_init&&window._altmetric_embed_init(),0);
}

document.addEventListener('click',event=>{const paperButton=event.target.closest('[data-id]');if(paperButton)detail(paperButton.dataset.id);});
$('.close').onclick=()=>$('#paper-dialog').close();
$('#paper-dialog').addEventListener('click',event=>{if(event.target===$('#paper-dialog'))$('#paper-dialog').close();});
$('#latest-more').onclick=()=>{limit+=30;render();};
render();
