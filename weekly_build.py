"""Export weekly references, deduplicated by canonical paper ID."""
import json
import re
from collections import Counter
from pathlib import Path
import yaml

def metadata(path):
    raw = path.read_text(encoding='utf-8-sig')
    match = re.match(r'\A---\s*\n(.*?)\n---', raw, re.S)
    return yaml.safe_load(match.group(1)) if match else {}

def build_weekly(root):
    root = Path(root)
    project = root.parent
    organs = json.loads((project/'03-网站建设/config/organs.json').read_text(encoding='utf-8-sig'))['organs']
    names = {o['id']: o['en'] for o in organs}
    aliases = {'pan-cancer':'pan_cancer','biliary':'biliary_tract','oral':'oral_cavity','brain-cns':'cns'}
    names.update({key:names[value] for key,value in aliases.items()})
    names_zh = {o['zh']: o['en'] for o in organs}
    weeks = []
    for folder in (project/'01-文献卡片/weekly').iterdir():
        if not folder.is_dir() or not (folder/'README.md').exists():
            continue
        summary = metadata(folder/'README.md')
        if summary.get('type') != 'weekly-summary':
            continue
        papers = {}
        updated = set()
        for ref in folder.glob('ref_*.md'):
            reference = metadata(ref)
            if reference.get('type') != 'weekly-paper-reference':
                continue
            path = (project/reference['main_card']).resolve()
            if not path.is_relative_to(project/'01-文献卡片') or 'weekly' in path.relative_to(project).parts:
                raise ValueError(f'Invalid canonical card: {ref}')
            card = metadata(path)
            pid = card['paper_id']
            if card.get('type') != 'paper' or pid != reference['paper_id']:
                raise ValueError(f'Card/reference identity mismatch: {ref}')
            events = reference.get('events', [])
            new_events = [e for e in events if e.get('event_type') in ('new_paper','new','new_discovery','late_discovery','historical_backfill')]
            if not new_events:
                updated.add(pid)
                continue
            organ = names.get(card['organ_ids'][0]) or names_zh[path.parent.name]
            jif = card.get('jif_2025')
            if isinstance(jif, bool) or not isinstance(jif, (float,int)) or card.get('jif_year') != 2025:
                jif = None
            stage = card.get('publication_stage')
            status = {'journal_issue':'Published', 'journal_online':'Online'}.get(stage, 'Unverified')
            papers[pid] = dict(id=pid,title=card['title'],journal=card['journal'],organ=organ,
                articleType=card.get('article_type','unknown'),jif=jif,jifYear=2025,
                jifSource=card.get('jif_source',''),jifSourceStatus=card.get('jif_source_status',''),
                status=status,onlineDate=str(card.get('published_online') or ''),
                issueDate=str(card.get('published_issue') or ''),checkedOn=str(card.get('status_checked_on') or ''),
                url=('https://doi.org/'+str(card['doi'])) if card.get('doi') else card.get('source_url',''),
                eventTypes=sorted({e['event_type'] for e in new_events}))
        rows = sorted(papers.values(), key=lambda p: (-(p['jif'] if p['jif'] is not None else -1),p['id']))
        counts = Counter(p['organ'] for p in rows)
        organ_counts = {k:v for k,v in counts.items() if k not in (names['pan_cancer'],names['unknown_primary'],names['metastasis_pair'])}
        # A companion commentary is kept in the weekly archive, but should
        # not displace an independent article in the five featured slots.
        ranked = [p for p in rows if p['jif'] is not None and p['articleType'] != 'comment']
        maximum = ranked[0]['jif'] if ranked else None
        weeks.append(dict(id=summary['week_id'],start=str(summary['period_start']),end=str(summary['period_end']),
            status=summary.get('search_status','unknown'),total=len(rows),updated=len(updated-set(papers)),
            kinds=dict(Counter(p['articleType'] for p in rows)),organCounts=dict(sorted(counts.items(),key=lambda x:(-x[1],x[0]))),
            topOrgans=[k for k,v in organ_counts.items() if v==max(organ_counts.values(),default=0)],
            topOrganCount=max(organ_counts.values(),default=0),
            highestJif=maximum,highestJifPapers=[p['id'] for p in ranked if p['jif']==maximum],
            topFive=ranked[:5],papers=rows,
            backfill=sum(any(t in ('late_discovery','historical_backfill') for t in p['eventTypes']) for p in rows)))
    weeks.sort(key=lambda w:w['start'],reverse=True)
    payload=dict(metricYear=2025,weeks=weeks)
    (root/'weekly-data.js').write_text('window.WEEKLY_UPDATES='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print('Weekly export:',[(w['id'],w['total']) for w in weeks])
    return payload
