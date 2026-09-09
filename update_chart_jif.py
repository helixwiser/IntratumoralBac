from pathlib import Path
root=Path(__file__).resolve().parent
p=root/'app.js';s=p.read_text(encoding='utf-8')
start=s.index('function chart(papers)')
end=s.index("\ndocument.addEventListener",start)
chart="""const pointRadius=p=>Number.isFinite(p.jif)?2*Math.sqrt(p.jif):4;
const jifLabel=p=>Number.isFinite(p.jif)?p.jif.toFixed(1):'Unavailable';
function chart(papers){
 const data=papers.filter(p=>Number.isFinite(p.citations)).sort((a,b)=>(b.jif??0)-(a.jif??0));
 const min=Math.min(2014,...all.map(p=>p.year)),max=2026;
 const ceiling=Math.max(100,Math.ceil(Math.max(...data.map(p=>p.citations),0)/100)*100);let html='';
 for(let i=0;i<=4;i++){let y=230-i*50;html+='<line x1="55" y1="'+y+'" x2="735" y2="'+y+'" stroke="#e7e7e7"/><text x="44" y="'+(y+4)+'" text-anchor="end">'+Math.round(i*ceiling/4)+'</text>'}
 for(let year=min;year<=max;year+=2){const x=75+(year-min)/(max-min)*635;html+='<text x="'+x+'" y="266" text-anchor="middle">'+year+'</text>'}
 data.forEach((p,i)=>{let x=75+(p.year-min)/(max-min)*635+(i%5-2)*3,y=230-p.citations/ceiling*200;
 const available=Number.isFinite(p.jif),label=p.author+' '+p.year+' · '+p.citations+' citations · 2025 JIF: '+jifLabel(p);
 html+='<circle class="dot" tabindex="0" role="button" aria-label="'+esc(short(p)+'; '+label)+'" data-id="'+p.id+'" cx="'+x+'" cy="'+y+'" r="'+pointRadius(p)+'" fill="'+(available?colors[p.organ]:'none')+'" fill-opacity=".60" stroke="#808080" stroke-width="1" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';
 });$('#chart').innerHTML=html;
}
function renderJournalMetrics(){
 const rows=window.JOURNAL_METRICS.journals,available=rows.filter(r=>Number.isFinite(r.jif_2025));
 $('#jif-coverage').textContent=available.length+' of '+rows.length+' journals · '+available.reduce((n,r)=>n+r.paper_count,0)+' of '+all.length+' papers';
 $('#journal-table').innerHTML=rows.map(r=>'<tr><td>'+esc(r.journal)+'</td><td>'+r.paper_count+'</td><td>'+(r.jif_2025===null?'Unavailable':r.jif_2025.toFixed(1))+'</td><td>'+esc(r.status==='verified_publisher'?'Publisher verified':r.status==='reported_secondary'?'Institutional JCR table':'Not verified')+'</td><td><a href="'+esc(r.source_url)+'" target="_blank" rel="noopener">Source ↗</a></td></tr>').join('');
}
"""
s=s[:start]+chart+s[end:]
s=s.replace("'<hr><p><b>Technical rigor", "'<hr><p><b>Technical rigor") 
s=s.replace("</p><hr><p><b>Technical rigor","</p><p class=\"small\">2025 Journal Impact Factor: '+jifLabel(p)+' (released 2026) · '+(p.jif===null?'No verified value':'<a href=\"'+esc(p.jifSource)+'\" target=\"_blank\" rel=\"noopener\">Source ↗</a>')+'</p><hr><p><b>Technical rigor")
s=s.replace("'<td>'+esc(p.journal)+'</td>'","'<td>'+esc(p.journal)+'</td>'")
s=s.replace("esc(p.journal)+'</td><td>'","esc(p.journal)+'<br><span class=\"small\">2025 JIF: '+jifLabel(p)+'</span></td><td>'")
s=s.rstrip()+'\nrenderJournalMetrics();\n'
p.write_text(s,encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('<script src="data.js"></script>','<script src="data.js"></script><script src="journal-metrics.js"></script>')
s=s.replace('Citations reflect scholarly attention, not evidence strength. Select a dot to read the record.','X: publication year. Y: citations. Circle area: 2025 Journal Impact Factor (released 2026). Hollow circle: JIF unavailable. Select a dot to read the record.')
s=s.replace('<div class="legend">','<div class="size-legend" aria-label="Circle size legend"><span>2025 JIF</span><svg width="220" height="48" viewBox="0 0 220 48" aria-hidden="true"><circle cx="18" cy="23" r="2.828" fill="#aaa" stroke="#808080"/><text x="30" y="27">2</text><circle cx="65" cy="23" r="6.325" fill="#aaa" stroke="#808080"/><text x="78" y="27">10</text><circle cx="124" cy="23" r="14.142" fill="#aaa" stroke="#808080"/><text x="144" y="27">50</text><circle cx="187" cy="23" r="4" fill="none" stroke="#808080"/><text x="198" y="27">N/A</text></svg></div><div class="legend">')
s=s.replace('</main>','<details class="journal-audit"><summary>Journal impact factors <span id="jif-coverage"></span></summary><p class="small">2025 metric year · 2026 release. Publisher figures are distinguished from institutional reproductions of JCR data. Missing values are not zero. Journal-level metrics do not evaluate individual papers.</p><a class="text-link" href="journal_impact_factors_2025.json" download>Download metrics and sources ↧</a><div class="table-wrap"><table><thead><tr><th>Journal</th><th>Papers</th><th>2025 JIF</th><th>Verification</th><th>Reference</th></tr></thead><tbody id="journal-table"></tbody></table></div></details></main>')
p.write_text(s,encoding='utf-8')
p=root/'style.css';s=p.read_text(encoding='utf-8').replace('circle.dot:hover{r:7;opacity:1}','circle.dot:hover,circle.dot:focus-visible{fill-opacity:.9;stroke:#555;stroke-width:2;outline:none}')
s+='\n.size-legend{display:flex;align-items:center;gap:10px;font-size:12px;color:#666}.chart-panel .size-legend svg{width:220px;max-width:100%;margin:0}.journal-audit{border-top:1px solid #bbb;margin-bottom:36px;padding-top:16px}.journal-audit summary{cursor:pointer;font-size:16px}.journal-audit summary span{font-size:12px;color:#777;margin-left:20px}.journal-audit td:first-child{width:42%}.journal-audit td:nth-child(2){width:8%}.journal-audit td:nth-child(3){width:12%}.journal-audit td:last-child{white-space:nowrap}.journal-audit a{color:#8a3030}\n'
p.write_text(s,encoding='utf-8')
