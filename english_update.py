from pathlib import Path
root=Path(__file__).resolve().parent
replacements={
'zh-CN':'en','瘤内菌研究图谱':'INTRATUMORAL MICROBIOME ATLAS','瘤内菌研究':'Intratumoral Microbiome Research',
'按器官阅读瘤内菌研究，探索时间、学术关注与研究问题。':'Explore intratumoral microbiome research by organ, publication year and citations.',
'文献快照 · 2026年9月9日':'LITERATURE SNAPSHOT · 9 SEPTEMBER 2026','专题导航':'Research topics','总览':'Overview','探索文献':'Explore research',
'器官专题':'ORGAN COLLECTIONS','从肿瘤的位置开始':'EXPLORE BY ORGAN',
'扁平人体器官示意图，显示乳腺、肺、肝脏及消化系统':'Human organ map showing the breast, lungs, liver and digestive system',
'浏览乳腺文献':'Browse breast research','浏览肺文献':'Browse lung research','浏览肝脏文献':'Browse liver research',
'在肿瘤内部，<br>重新认识微生物。':'Inside the tumor.<br>A microbial world.',
'从组织定位到免疫与代谢，沿器官阅读瘤内菌研究。':'Explore the microbes within tumors, from tissue localization to immunity and metabolism.',
'选择图中乳腺、肝脏或肺，查看相关文献。':'Select breast, liver or lung to explore the research.',
'研究选读 <span>FOCUS</span>':'Research focus','研究选读':'Research focus','我们的阅读维度':'OUR REVIEW LENS',
'技术严谨性<br>与概念创新性':'Technical rigor.<br>Conceptual novelty.',
'关注检测信号是否可靠，以及研究提出了什么新问题。':'How reliable is the microbial signal? What new question does the study open?',
'当前为基础卡片，全文评价待完成。':'Basic records available. Full-text assessments pending.',
'近期文献 <span>RECENT</span>':'Latest research','进入文献索引':'Browse the collection',
'文献索引':'The collection','全部器官':'All organs','发表年份 × 引用量':'Publication year × citations','文献发表年份与引用量分布图':'Research papers plotted by publication year and citation count',
'引用量反映学术关注，不等同于证据强度。点击圆点阅读卡片。':'Citations reflect scholarly attention, not evidence strength. Select a dot to read the record.',
'一篇研究，<br>两个追问。':'One study.<br>Two questions.',
'<b>技术</b>　组织内信号是否可信？':'<b>RIGOR</b> Is the tissue signal reliable?',
'<b>概念</b>　它改变了什么理解？':'<b>NOVELTY</b> What does it change?',
'收录与评价分开：相关原始研究进入文献库，评价随全文审阅逐步补全。':'Relevant original studies enter the collection. Assessments develop through full-text review.',
'年份 / 器官':'Year / Organ','论文':'Paper','期刊':'Journal','引用':'Citations','审阅':'Review',
'查看更多文献':'Show more papers','单页预览':'Single-page preview','基于现有文献卡片':'Based on the literature collection','关闭卡片':'Close record',
'乳腺':'Breast','肝脏':'Liver','肺':'Lung','全部':'All'}
path=root/'index.html'
text=path.read_text(encoding='utf-8')
for a,b in replacements.items():text=text.replace(a,b)
text=text.replace('</div>\n<div class="atlas-caption">','<span class="map-label stomach">Stomach</span><span class="map-label pancreas">Pancreas</span><span class="map-label colon">Colorectum</span><span class="map-label bladder">Bladder</span></div>\n<div class="atlas-caption">')
path.write_text(text,encoding='utf-8')
path=root/'app.js';text=path.read_text(encoding='utf-8')
for a,b in {'全部器官':'All organs','全部':'All','乳腺':'Breast','肝脏':'Liver','肺':'Lung',
'已收录基础卡片，详细研究解读待补充。':'Basic record available. Detailed interpretation is pending.',
'引用量：':'Citations: ','待核实':'Unavailable','2026年9月9日':'9 September 2026',
'技术严谨性':'Technical rigor','概念创新性':'Conceptual novelty','待全文审阅':'Full-text assessment pending',
'污染控制、独立验证与因果证据待核查。':'Contamination controls, independent validation and causal evidence remain to be reviewed.',
'阅读原文':'Read the paper',' 篇卡片 · 3 个器官专题':' records · 3 organ collections',' 篇':' papers',
'从组织中的微生物信号出发，阅读研究设计与主要问题。':'Explore the study design and its central research question.',
'基础卡片':'Basic record','引用 ':'Citations: ',' 引用':' citations'}.items():text=text.replace(a,b)
text=text.replace("const all=window.PAPERS;", """const organNames={'乳腺':'Breast','肝脏':'Liver','肺':'Lung'};
const focusNotes={
'ITB-000078':'Spatial meta-transcriptomics connects bacterial burden with distinct oncogenic signatures in lung cancer cells.',
'ITB-000048':'A study of gut-to-liver translocation of Klebsiella pneumoniae and its role in hepatocellular carcinoma.'
};
const all=window.PAPERS.map(p=>({...p,organ:organNames[p.organ]||p.organ,short:p.title,summary:focusNotes[p.id]||'',review:'Full-text review is pending, including contamination controls, localization, independent validation and causal evidence.'}));""")
text=text.replace(".slice(0,135)","")
path.write_text(text,encoding='utf-8')
path=root/'style.css';text=path.read_text(encoding='utf-8')
text+='\n/* English labels cover the original raster labels at their source positions. */\n'
text+='.hotspot,.map-label{display:flex;align-items:center;justify-content:center;background:#f3f5f4;font-size:clamp(10px,1vw,13px);font-weight:600;box-shadow:none;white-space:nowrap}.hotspot{height:6%;padding:0 3px}.breast{left:0;top:29.8%;width:21%}.lung{right:-2%;top:29.8%;width:16%}.liver{left:0;top:48%;width:17%}.map-label{position:absolute;height:6%;pointer-events:none;color:#245566;z-index:2}.stomach{right:-3%;top:48%;width:17%}.pancreas{right:-9%;top:55%;width:25%}.colon{left:-3%;top:67%;width:23%}.bladder{right:-8%;top:78%;width:24%}.mast-sub{letter-spacing:3px}.recent-item h3{line-height:1.5}.focus-item h3{font-size:21px}.focus-item .eyebrow{font-size:10px;letter-spacing:.7px}.atlas h1{font-size:34px}.rule-title{font-size:21px}.table-wrap td:last-child{white-space:normal}\n'
path.write_text(text,encoding='utf-8')
print('English interface and organ labels applied.')
