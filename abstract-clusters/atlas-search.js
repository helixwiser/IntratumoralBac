/* DOI lookup and nearest-paper ranking use the existing similarity matrix. */
window.AtlasSearch={
 normalizeDoi(value){let s=String(value||'').trim();try{s=decodeURIComponent(s);}catch{}return s.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi\s*:\s*/i,'').replace(/[\s.,;]+$/g,'').toLowerCase();},
 resolve(papers,query){const q=String(query||'').trim().toLowerCase();if(!q)return -1;const doi=this.normalizeDoi(q);const exact=papers.findIndex(p=>p.doi&&this.normalizeDoi(p.doi)===doi||p.id.toLowerCase()===q||p.title.toLowerCase()===q);if(exact>=0)return exact;const matches=papers.map((p,i)=>({p,i})).filter(({p})=>(p.title+' '+p.doi+' '+p.id).toLowerCase().includes(q));return matches.length===1?matches[0].i:-1;},
 related(papers,source,similarity,threshold=.7){if(source<0||source>=papers.length)return [];return papers.map((p,i)=>({index:i,id:p.id,score:similarity(source,i)})).filter(p=>p.index===source||Number.isFinite(p.score)&&p.score>threshold).sort((a,b)=>a.index===source?-1:b.index===source?1:b.score-a.score||a.id.localeCompare(b.id));},
 nearest(papers,source,similarity,count=3){return papers.map((p,i)=>({index:i,id:p.id,score:similarity(source,i)})).filter(p=>p.index!==source).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,count);}
};
