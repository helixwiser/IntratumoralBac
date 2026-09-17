(() => {
  const host = document.getElementById('weekly-update');
  if (!host) return;
  const weeks = window.WEEKLY_UPDATES?.weeks || [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (!weeks.length) { host.innerHTML = '<h2>Weekly Update</h2><p>No weekly updates yet.</p>'; return; }
  host.innerHTML = `<div class="weekly-heading"><div><h2>Weekly Update<span>.</span></h2></div><label>Browse week <select id="weekly-select" aria-label="Choose weekly update">${weeks.map(w=>`<option value="${escape(w.id)}">${escape(w.id)} · ${escape(w.start)} – ${escape(w.end)}</option>`).join('')}</select></label></div><div id="weekly-content" aria-live="polite"></div>`;
  function render(id) {
    const week = weeks.find(w=>w.id===id) || weeks[0];
    const weekLabel = `${week.start.slice(0,4)} ${new Date(week.start+'T00:00:00Z').toLocaleString('en',{month:'short',timeZone:'UTC'}).toUpperCase()} WEEK${week.id.split('-').at(-1)}`;
    const topCount = Math.max(0,...Object.values(week.organCounts));
    const leaders = week.papers.filter(p=>week.highestJifPapers.includes(p.id));
    const journalNames = [...new Set(leaders.map(p=>p.journal))].join(' / ');
    const paperItem = (p,i) => `<li data-paper-id="${escape(p.id)}"><span class="weekly-rank">${String(i+1).padStart(2,'0')}</span><div><div class="weekly-meta"><span>${escape(p.organ)}</span><span class="weekly-status ${p.status.toLowerCase()}">${escape(p.status)}</span><span>${escape(p.articleType)}</span></div><h4><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">${escape(p.title)} ↗</a></h4><p>${escape(p.journal)}</p><p class="weekly-date">Online ${escape(p.onlineDate || 'date unverified')}${p.status==='Published' && p.issueDate ? ` · Issue ${escape(p.issueDate)}`:''}</p></div></li>`;
    const chronological = [...week.papers].sort((a,b)=>b.onlineDate.localeCompare(a.onlineDate)||a.id.localeCompare(b.id));
    const recent = document.getElementById('recent');
    if (recent) {
      recent.innerHTML = `<ol class="weekly-papers weekly-latest">${chronological.slice(0,5).map(p=>`<li data-paper-id="${escape(p.id)}"><div><div class="weekly-meta"><span>${escape(p.organ)}</span><span class="weekly-status ${p.status.toLowerCase()}">${escape(p.status)}</span></div><h4><a href="${escape(p.url)}" title="${escape(p.title)}" target="_blank" rel="noopener noreferrer">${escape(p.title)}</a></h4><p class="weekly-latest-journal">${escape(p.journal)}</p></div></li>`).join('')}</ol>`;
      const more = recent.parentElement.querySelector('.text-link');
      if (more) { more.href='#weekly-list'; more.textContent=`View all ${week.total} weekly papers ↓`; more.onclick=()=>{document.getElementById('weekly-list').open=true;}; }
    }
    document.getElementById('weekly-content').innerHTML = `
      <div class="weekly-context"><span class="weekly-state">${weekLabel}</span></div>
      <div class="weekly-stats">
        <article><span class="eyebrow">NEW TO LIBRARY</span><strong class="weekly-new-count">${week.total}</strong><p>${week.kinds.original||0} original studies · ${week.kinds.review||0} reviews · ${week.kinds.comment||0} commentaries</p></article>
        <article><span class="eyebrow">LARGEST ORGAN INCREASE</span><strong>+${week.topOrganCount}</strong><p>${escape(week.topOrgans.join(' / ') || 'No additions')}${week.topOrgans.length>1?' · tied':''}</p></article>
        <article><span class="eyebrow">HIGHEST-IMPACT JOURNAL</span><strong class="weekly-journal-name">${escape(journalNames || 'Not available')}</strong></article>
      </div>
      <div class="weekly-grid"><section class="weekly-highlights"><h3 class="rule-title">Weekly highlights</h3><ol class="weekly-papers">${week.topFive.map(paperItem).join('')}</ol></section><details id="weekly-list" class="weekly-list"><summary><span>Weekly Update</span><span>${week.total} papers <i aria-hidden="true">＋</i></span></summary><ol class="weekly-papers">${chronological.map(paperItem).join('')}</ol></details>
      <aside class="weekly-organs"><h3>Additions by organ</h3>${Object.entries(week.organCounts).map(([organ,count])=>`<div class="weekly-organ"><div><span>${escape(organ)}</span><b>+${count}</b></div><div class="weekly-bar"><i style="width:${count/topCount*100}%"></i></div></div>`).join('')}</aside></div>`;
  }
  document.getElementById('weekly-select').addEventListener('change',e=>render(e.target.value));
  render(weeks[0].id);
})();
