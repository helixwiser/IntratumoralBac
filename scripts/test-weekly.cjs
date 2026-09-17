const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.locator('#weekly-update').scrollIntoViewIfNeeded();
  await page.locator('#recent .weekly-papers li').first().waitFor();
  const result=await page.evaluate(()=>{
    const w=window.WEEKLY_UPDATES.weeks[0];
    return {total:w.total,unique:new Set(w.papers.map(p=>p.id)).size,
      sum:Object.values(w.organCounts).reduce((a,b)=>a+b,0),top:w.topFive.map(p=>p.jif),
      organs:w.topOrgans,organCount:w.topOrganCount,statuses:w.topFive.map(p=>p.status),
      links:[...document.querySelectorAll('#recent .weekly-papers h4 a')].map(a=>a.href)};
  });
  assert.equal(result.total,41);assert.equal(result.unique,41);assert.equal(result.sum,41);
  assert.equal(await page.locator('.weekly-state').innerText(),'2026 SEP WEEK3');
  assert.equal(result.top.length,5);assert.deepEqual(result.top,[...result.top].sort((a,b)=>b-a));
  assert.deepEqual(result.organs,['Colorectal']);assert.equal(result.organCount,14);
  assert(result.statuses.includes('Online')&&result.statuses.includes('Published'));
  assert(result.links.every(link=>link.startsWith('https://doi.org/')));
  const display = await page.evaluate(()=>{
    const w=window.WEEKLY_UPDATES.weeks[0];
    const ids=selector=>[...document.querySelectorAll(selector)].map(el=>el.dataset.paperId);
    const online=document.querySelector('.weekly-highlights .online');
    const published=document.querySelector('.weekly-highlights .published');
    return {highlights:ids('.weekly-highlights li'),expected:w.topFive.map(p=>p.id),
      recent:ids('#recent li'),chronological:[...w.papers].sort((a,b)=>b.onlineDate.localeCompare(a.onlineDate)||a.id.localeCompare(b.id)).slice(0,5).map(p=>p.id),
      fonts:[...document.querySelectorAll('.weekly-highlights h4,#recent h4')].map(el=>getComputedStyle(el).font),
      borders:[online,published].map(el=>[getComputedStyle(el).borderTopWidth,getComputedStyle(el).borderTopColor])};
  });
  assert.deepEqual(display.highlights,display.expected);
  assert.deepEqual(display.recent,display.chronological);
  assert.equal(new Set(display.fonts).size,1);
  assert.deepEqual(display.borders,[['2px','rgb(169, 36, 40)'],['2px','rgb(17, 17, 17)']]);
  await page.selectOption('#weekly-select','26-09-3');
  assert.equal(await page.locator('#recent .weekly-papers li').count(),5);
  assert.equal(await page.locator('#weekly-list').getAttribute('open'),null);
  await page.locator('#weekly-list summary').click();
  assert.equal(await page.locator('#weekly-list .weekly-papers li').count(),41);
  assert.equal(await page.locator('#weekly-list .weekly-papers li:visible').count(),41);
  await page.locator('#weekly-list summary').click();
  await page.locator('#recent').locator('..').locator('.text-link').click();
  assert.notEqual(await page.locator('#weekly-list').getAttribute('open'),null);
  await page.locator('#weekly-list summary').click();
  assert.equal(await page.locator('.weekly-journal-name').innerText(),'Cancer Cell');
  assert(!/56\.1|HIGHEST JOURNAL JIF/.test(await page.locator('#weekly-update').innerText()));
  await page.locator('#weekly-update').screenshot({path:process.env.TEMP+'/weekly-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#weekly-update').scrollIntoViewIfNeeded();
  const overflow=await page.locator('#weekly-update').evaluate(el=>el.scrollWidth>el.clientWidth);
  assert.equal(overflow,false);
  await page.locator('#weekly-update').screenshot({path:process.env.TEMP+'/weekly-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify(result));
  // Empty data remains a readable section, without a selector or runtime failure.
  await page.evaluate(()=>{window.WEEKLY_UPDATES={weeks:[]}});
  await page.addScriptTag({url:'http://127.0.0.1:8765/weekly.js?empty-test'});
  assert.match(await page.locator('#weekly-update').innerText(),/No weekly updates yet/);
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
