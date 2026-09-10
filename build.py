from __future__ import annotations

from collections import Counter
from datetime import date
from hashlib import sha256
from html import unescape
from pathlib import Path
import json
import re
import shutil

import yaml

root = Path(__file__).resolve().parent
project = root.parent.parent
cards_root = project / "01-文献卡片"
metric_source = project / "02-更新指标" / "journal_impact_factors_2025.json"
date_source = project / "02-更新指标" / "publication_dates_crossref.json"
openalex_source = project / "02-更新指标" / "latest_openalex_metrics.json"
attention_source = project / "02-更新指标" / "latest_attention_metrics.json"
organ_source = project / "03-网站建设" / "config" / "organs.json"
abstract_run = project / "00-搜索策略" / "runs" / "ITB-READING-AUDIT-20260910" / "sources"
landmark_source = root / "landmark-config.json"
front_re = re.compile(r"\A---\s*\r?\n(.*?)\r?\n---\s*(?:\r?\n|\Z)", re.S)


def load_card(path: Path):
    raw = path.read_text(encoding="utf-8-sig")
    match = front_re.search(raw)
    if not match:
        return None
    metadata = yaml.safe_load(match.group(1))
    if not isinstance(metadata, dict) or not re.fullmatch(r"ITB-\d{6}", str(metadata.get("paper_id") or "")):
        return None
    return metadata, raw[match.end():].strip()


def section(body: str, name: str) -> str:
    match = re.search(rf"^## {re.escape(name)}\s*\r?\n(.*?)(?=^## |\Z)", body, re.S | re.M)
    return match.group(1).strip() if match else ""


def integer_or_none(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return None


def normalized_doi(value):
    return re.sub(r"^https?://(?:dx\.)?doi\.org/", "", str(value or "").strip(), flags=re.I).casefold()


def clean_abstract(value):
    text = unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_jsonl(path: Path):
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


metrics = json.loads(metric_source.read_text(encoding="utf-8-sig"))
legacy_dates = json.loads(date_source.read_text(encoding="utf-8-sig")).get("dates", {})
organ_config = json.loads(organ_source.read_text(encoding="utf-8-sig"))
landmark_config = json.loads(landmark_source.read_text(encoding="utf-8-sig"))
organ_by_zh = {row["zh"]: row for row in organ_config["organs"]}
organ_by_id = {row["id"]: row for row in organ_config["organs"]}
def norm_journal(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())

journal_by_name = {norm_journal(row["journal"]): row for row in metrics["journals"]}
openalex_payload = json.loads(openalex_source.read_text(encoding="utf-8-sig")) if openalex_source.exists() else {}
openalex_metrics = openalex_payload.get("metrics", {})
attention_metrics = json.loads(attention_source.read_text(encoding="utf-8-sig")).get("metrics", {}) if attention_source.exists() else {}
abstract_by_pmid = {}
abstract_by_doi = {}
abstract_by_title = {}
for provider in ["pubmed", "openalex", "crossref"]:
    for row in load_jsonl(abstract_run / provider / "records.jsonl"):
        abstract_text = clean_abstract(row.get("abstract"))
        if not abstract_text:
            continue
        record = {
            "text": abstract_text,
            "provider": "PubMed" if provider == "pubmed" else ("OpenAlex" if provider == "openalex" else "Crossref"),
            "url": str(row.get("source_url") or ""),
        }
        pmid = str(row.get("pmid") or "").strip()
        doi = normalized_doi(row.get("doi"))
        title = re.sub(r"\s+", " ", str(row.get("title") or "")).strip().casefold()
        if pmid and pmid not in abstract_by_pmid:
            abstract_by_pmid[pmid] = record
        if doi and doi not in abstract_by_doi:
            abstract_by_doi[doi] = record
        if title and title not in abstract_by_title:
            abstract_by_title[title] = record
papers = []

for path in sorted(cards_root.rglob("*.md")):
    if path.name == "文献卡片模板.md":
        continue
    loaded = load_card(path)
    if loaded is None:
        continue
    metadata, body = loaded
    if str(metadata.get("screening_status") or "").casefold() == "excluded":
        continue
    folder_organ = path.parent.name
    journal = str(metadata.get("journal") or "").strip()
    journal_metric = journal_by_name.get(norm_journal(journal))
    if journal_metric is None:
        raise ValueError(f"Journal missing from metric registry: {journal} ({metadata['paper_id']})")
    if not isinstance(journal_metric.get("jif_2025"), (int, float)) or isinstance(journal_metric.get("jif_2025"), bool):
        raise ValueError(f"Active paper has no numeric 2025 JIF: {journal} ({metadata['paper_id']})")
    paper_id = str(metadata["paper_id"])
    organ_ids = metadata.get("organ_ids") if isinstance(metadata.get("organ_ids"), list) else []
    primary_organ_id = organ_ids[0] if organ_ids else (organ_by_zh.get(folder_organ) or {}).get("id")
    if primary_organ_id not in organ_by_id:
        raise ValueError(f"Unregistered organ id: {primary_organ_id} ({path.name})")
    organ_row = organ_by_id[primary_organ_id]
    oa_metric = openalex_metrics.get(paper_id, {})
    attention = attention_metrics.get(paper_id, {})
    pmid = "" if metadata.get("pmid") in (None, "null") else str(metadata.get("pmid") or "").strip()
    doi = "" if metadata.get("doi") in (None, "null") else str(metadata.get("doi") or "").strip()
    title = str(metadata.get("title") or "")
    title_key = re.sub(r"\s+", " ", title).strip().casefold()
    abstract_status = str(metadata.get("abstract_status") or "").strip().casefold()
    card_abstract = re.split(
        r"^### Abstract provenance\s*$",
        section(body, "Original abstract"),
        maxsplit=1,
        flags=re.M,
    )[0].strip()
    if abstract_status == "available":
        if not card_abstract:
            raise ValueError(f"Card marks abstract available but has no original abstract: {paper_id}")
        abstract_record = {
            "text": clean_abstract(card_abstract),
            "provider": str(metadata.get("abstract_source") or "").strip(),
            "url": str(metadata.get("abstract_source_url") or "").strip(),
        }
        if not abstract_record["provider"]:
            raise ValueError(f"Card abstract has no source: {paper_id}")
    elif abstract_status == "unavailable":
        if card_abstract:
            raise ValueError(f"Card marks abstract unavailable but contains abstract text: {paper_id}")
        abstract_record = None
    else:
        # Migration fallback for legacy cards only. New and updated cards must carry
        # an explicit status so the card remains the canonical abstract record.
        abstract_record = abstract_by_pmid.get(pmid) or abstract_by_doi.get(normalized_doi(doi)) or abstract_by_title.get(title_key)
    plot_date = metadata.get("plot_date") or oa_metric.get("publication_date") or legacy_dates.get(paper_id)
    citation_value = oa_metric.get("value_numeric") if oa_metric.get("retrieval_status") == "ok" else integer_or_none(metadata.get("citation_count"))
    papers.append({
        "id": paper_id,
        "title": title,
        "cardTitle": str(metadata.get("card_title") or ""),
        "cardTitleEn": str(metadata.get("card_title_en") or ""),
        "author": str(metadata.get("first_author") or ""),
        "authors": metadata.get("authors") if isinstance(metadata.get("authors"), list) else [],
        "year": int(metadata["year"]),
        "journal": journal_metric["journal"],
        "doi": doi,
        "pmid": pmid,
        "abstract": abstract_record["text"] if abstract_record else "",
        "abstractSource": abstract_record["provider"] if abstract_record else "",
        "abstractSourceUrl": abstract_record["url"] if abstract_record else "",
        "organId": primary_organ_id,
        "organ": organ_row["en"],
        "organs": metadata.get("organs") if isinstance(metadata.get("organs"), list) else [folder_organ],
        "primaryCancerSites": metadata.get("primary_cancer_sites") if isinstance(metadata.get("primary_cancer_sites"), list) else [],
        "sampleSites": metadata.get("sample_sites") if isinstance(metadata.get("sample_sites"), list) else [],
        "cancerTypes": metadata.get("cancer_types") if isinstance(metadata.get("cancer_types"), list) else [],
        "microbeTypes": metadata.get("microbe_types") if isinstance(metadata.get("microbe_types"), list) else [],
        "taxa": metadata.get("taxa") if isinstance(metadata.get("taxa"), list) else [],
        "questionCategories": metadata.get("question_categories") if isinstance(metadata.get("question_categories"), list) else [],
        "studyDesigns": metadata.get("study_designs") if isinstance(metadata.get("study_designs"), list) else [],
        "scopeClass": str(metadata.get("scope_class") or ""),
        "publicationVersion": str(metadata.get("publication_version") or ""),
        "publicationStatus": str(metadata.get("publication_status") or ""),
        "retractionDoi": str(metadata.get("retraction_doi") or ""),
        "reviewStatus": str(metadata.get("review_status") or ""),
        "contentStatus": str(metadata.get("content_status") or ""),
        "fullTextAccess": str(metadata.get("full_text_access") or ""),
        "summary": str(metadata.get("summary_en") or ""),
        "whyRead": str(metadata.get("why_read_en") or ""),
        "keyLimitation": str(metadata.get("key_limitation_en") or ""),
        "technicalRigor": metadata.get("technical_rigor"),
        "technicalInnovation": metadata.get("technical_innovation"),
        "conceptualNovelty": metadata.get("conceptual_novelty"),
        "assessmentConfidence": str(metadata.get("assessment_confidence") or ""),
        "citationCount": citation_value,
        "citations": citation_value,
        "citationSource": "OpenAlex" if oa_metric.get("retrieval_status") == "ok" else str(metadata.get("citation_source") or ""),
        "citationSourceId": str(oa_metric.get("source_record_id") or metadata.get("citation_source_id") or ""),
        "citationCheckedOn": str(openalex_payload.get("snapshot_date") or metadata.get("citation_checked_on") or ""),
        "citationStatus": oa_metric.get("retrieval_status") or "not_checked",
        "altmetricScore": attention.get("altmetric", {}).get("value_numeric"),
        "altmetricStatus": attention.get("altmetric", {}).get("retrieval_status") or "not_checked",
        "publishedOnline": str(metadata.get("published_online") or ""),
        "publishedIssue": str(metadata.get("published_issue") or ""),
        "publishedOn": str(plot_date or ""),
        "plotDate": str(plot_date or ""),
        "datePrecision": str(metadata.get("date_precision") or ""),
        "dateKind": str(metadata.get("date_kind") or ""),
        "dateSource": str(metadata.get("date_source") or ""),
        "jif": journal_metric["jif_2025"],
        "jifSource": journal_metric["source_url"],
        "jifStatus": journal_metric["status"],
        "selectionReason": str(metadata.get("selection_reason") or ""),
        "screeningStatus": str(metadata.get("screening_status") or "included"),
        "inclusionReason": section(body, "为什么入选") or section(body, "相关性"),
    })

ids = [paper["id"] for paper in papers]
if len(ids) != len(set(ids)):
    raise ValueError("Duplicate paper IDs in canonical export")

paper_by_doi = {normalized_doi(paper["doi"]): paper for paper in papers if normalized_doi(paper["doi"])}
landmark_dois = [normalized_doi(value) for value in landmark_config["collection_focus"]["dois"]]
if len(landmark_dois) != len(set(landmark_dois)):
    raise ValueError("Duplicate DOI in landmark configuration")
missing_landmark_dois = [doi for doi in landmark_dois if doi not in paper_by_doi]
if missing_landmark_dois:
    raise ValueError(f"Landmark DOI not found in canonical export: {missing_landmark_dois}")
landmark_config["paperIds"] = [paper_by_doi[doi]["id"] for doi in landmark_dois]

counts = Counter(norm_journal(paper["journal"]) for paper in papers)
for row in metrics["journals"]:
    row["paper_count"] = counts[norm_journal(row["journal"])]

active_organ_ids = sorted({paper["organId"] for paper in papers})
web_organs = [row for row in organ_config["organs"] if row["id"] in active_organ_ids]
payload = json.dumps(papers, ensure_ascii=False, separators=(",", ":"))
metric_payload = json.dumps(metrics, ensure_ascii=False, separators=(",", ":"))
manifest = {
    "schema_version": "1.0",
    "built_on": date.today().isoformat(),
    "paper_count": len(papers),
    "paper_ids_sha256": sha256("\n".join(sorted(ids)).encode("utf-8")).hexdigest(),
    "organ_counts": dict(sorted(Counter(paper["organId"] for paper in papers).items())),
    "citation_available": sum(paper["citations"] is not None for paper in papers),
    "publication_date_available": sum(bool(paper["publishedOn"]) for paper in papers),
    "jif_available": sum(paper["jif"] is not None for paper in papers),
    "abstract_available": sum(bool(paper["abstract"]) for paper in papers),
    "abstract_missing": sum(not bool(paper["abstract"]) for paper in papers),
}

(root / "data.js").write_text("window.PAPERS=" + payload + ";\n", encoding="utf-8")
(root / "journal-metrics.js").write_text("window.JOURNAL_METRICS=" + metric_payload + ";\n", encoding="utf-8")
(root / "organ-config.js").write_text("window.ORGAN_CONFIG=" + json.dumps(web_organs, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
(root / "landmark-config.js").write_text("window.LANDMARK_CONFIG=" + json.dumps(landmark_config, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
(root / "data-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(root / "assets").mkdir(exist_ok=True)
shutil.copy2(root.parent / "素材库" / "人体器官导航_乳腺投影_v4.png", root / "assets" / "organ-map.png")

out = root / "dist"
out.mkdir(exist_ok=True)
for name in ["index.html", "latest.html", "scatter-demo.html", "halo-demo.html", "style.css", "scatter-demo.css", "halo-demo.css", "homepage-study.css", "app.js", "scatter-demo.js", "halo-demo.js", "homepage-study.js", "reading-set.js", "latest.js", "data.js", "journal-metrics.js", "organ-config.js", "landmark-config.js", "landmark-config.json", "data-manifest.json", "journal_impact_factors_2025.json"]:
    shutil.copy2(root / name, out / name)
shutil.copytree(root / "assets", out / "assets", dirs_exist_ok=True)
shutil.copytree(root / "abstract-clusters", out / "abstract-clusters", dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("test-*.cjs", "README.md"))
print(json.dumps(manifest, ensure_ascii=False))
