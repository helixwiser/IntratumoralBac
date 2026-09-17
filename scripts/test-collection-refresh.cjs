const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    const all=window.PAPERS;
    const ids=new Set(all.map(p=>p.id));
    const dots=[...document.querySelectorAll('circle.dot')];
    return {total:all.length,unique:ids.size,manifestDate:window.DATA_BUILT_ON,
      inventory:document.querySelector('#inventory').textContent,
      claimCount:document.querySelector('#collection-record-count').textContent,
      organCount:all.filter(p=>p.organId==='colorectal').length,
      colorectalLabel:document.querySelector('.organ-dot[data-organ="Colorectal"]')?.getAttribute('aria-label'),
      dots:dots.length,pendingDots:dots.filter(d=>d.getAttribute('stroke-dasharray')==='2 2').length,
      newDotIds:dots.filter(d=>/^ITB-0009(?:[4-8]\d)$/.test(d.dataset.id)).map(d=>d.dataset.id),
      collectionCount:document.querySelector('#selection-label').textContent,
      newPaper:all.find(p=>p.id==='ITB-000952')};
  });
  assert.equal(result.total,792);assert.equal(result.unique,792);
  assert.match(result.inventory,/792 records/);assert.equal(result.claimCount,'792');
  assert.equal(result.organCount,170);assert.match(result.colorectalLabel,/170 papers/);
  assert.match(result.collectionCount,/792 papers/);
  assert(result.newDotIds.includes('ITB-000952'));
  assert(result.pendingDots>=41);
  assert.equal(result.newPaper.publishedOn,'2026-08-17');
  assert.equal(result.newPaper.jif,56.1);
  const dates=await page.evaluate(()=>({
    published:publicationTimeline(window.PAPERS.find(p=>p.id==='ITB-000945')),
    online:publicationTimeline(window.PAPERS.find(p=>p.id==='ITB-000952')),
    historical:publicationTimeline(window.PAPERS.find(p=>p.id==='ITB-000001')),
    firstRow:document.querySelector('#papers tr td')?.textContent,
  }));
  assert.match(dates.published,/Online.*2026-06-25/);
  assert.match(dates.published,/Published.*2026-07-13/);
  assert.match(dates.online,/Online.*2026-08-17/);
  assert.doesNotMatch(dates.online,/Published/);
  assert.match(dates.historical,/Year.*2014/);
  assert.match(dates.firstRow,/Online/);
  await page.locator('.nav-left button[data-organ="Colorectal"]').click();
  assert.match(await page.locator('#selection-label').innerText(),/170 papers/);
  await page.goto('http://127.0.0.1:8765/latest.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>window.PAPERS.length),792);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({total:result.total,colorectal:result.organCount,dots:result.dots,pendingDots:result.pendingDots,newDotIds:result.newDotIds.length}));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
