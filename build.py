from pathlib import Path
import re,json,shutil
root=Path(__file__).resolve().parent
project=root.parent.parent
papers=[]
for organ in ['乳腺','肝脏','肺']:
    for path in sorted((project/'01-文献卡片'/organ).glob('*.md')):
        text=path.read_text(encoding='utf-8-sig')
        def field(key):
            match=re.search(r'^'+key+r':\s*([^\r\n]*)',text,re.M)
            return match.group(1).strip().strip('"').strip("'") if match else ''
        if not field('paper_id'): continue
        head=re.search(r'^# (.+)$',text,re.M)
        short=head.group(1).split('：',1)[-1] if head else ''
        def section(name):
            match=re.search(r'## '+name+r'\s*\n(.*?)(?=\n## |\Z)',text,re.S)
            return re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',match.group(1)).strip().replace('**','') if match else ''
        citation=field('citation_count')
        papers.append(dict(id=field('paper_id'),title=field('title'),author=field('first_author'),year=int(field('year')),journal=field('journal'),doi=field('doi') if field('doi')!='null' else '',organ=organ,short=short,citations=int(citation) if citation.isdigit() else None,summary=section('相关性'),review=section('当前审阅')))
assert len({p['id'] for p in papers})==len(papers)
metric_path=root/'journal_impact_factors_2025.json'
canonical_metric_path=project/'02-更新指标/journal_impact_factors_2025.json'
if canonical_metric_path.exists():
    shutil.copy2(canonical_metric_path,metric_path)
metrics=json.loads(metric_path.read_text(encoding='utf-8'))
journals={r['journal'].casefold():r for r in metrics['journals']}
for p in papers:
    metric=journals.get(p['journal'].casefold())
    assert metric is not None,p['journal']
    p['journal']=metric['journal']
    p['jif']=metric['jif_2025']
    p['jifSource']=metric['source_url']
    p['jifStatus']=metric['status']
(root/'journal-metrics.js').write_text('window.JOURNAL_METRICS='+json.dumps(metrics,ensure_ascii=False)+';',encoding='utf-8')
(root/'data.js').write_text('window.PAPERS='+json.dumps(papers,ensure_ascii=False)+';',encoding='utf-8')
(root/'assets').mkdir(exist_ok=True)
shutil.copy2(root.parent/'素材库'/'人体器官导航_无标注_v1.png',root/'assets'/'organ-map.png')
out=root/'dist'
out.mkdir(exist_ok=True)
for name in ['index.html','style.css','app.js','data.js','journal-metrics.js','journal_impact_factors_2025.json']:
    shutil.copy2(root/name,out/name)
shutil.copytree(root/'assets',out/'assets',dirs_exist_ok=True)
print('Built:',len(papers),'cards;', {o:sum(p['organ']==o for p in papers) for o in ['乳腺','肝脏','肺']})
