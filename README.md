# IntratumoralBac

This is the **website repository**. Open this folder as a separate Codex project. Literature cards, search strategies, metrics, and Obsidian notes remain in the parent `IntratumoralBac` folder; they are not part of this GitHub repository.

IntratumoralBac is an interactive research atlas for exploring the intratumoral microbiome literature across organs, publication time, citations, journals, named taxa, and abstract-level research patterns.

## Website

The atlas provides:

- organ-specific literature collections;
- publication year, citation, attention, and journal-level views;
- curated research-focus papers;
- an abstract explorer with paper-similarity search;
- abstract-level research-action statistics and source sentences.

The similarity explorer returns every paper with cosine similarity strictly greater than 0.7 and includes the selected source paper. Automated labels and action matches are discovery aids. They are not full-text assessments of technical rigor, causality, or evidence quality.

## Data status

The current release is a literature snapshot rather than a completed systematic review. Citation counts and publication metadata reflect their recorded retrieval dates. Journal Impact Factor is a journal-level contextual metric and must not be interpreted as an assessment of an individual paper.

## Local use

Open `index.html` in a browser. The site is static and has no runtime dependencies.

To rebuild `data.js` and the Sites `dist/` output from the literature project, keep this folder inside `IntratumoralBac`, install `requirements.txt` in a Python environment, and run `python build.py` here. The build reads cards, metrics, organ configuration, and approved abstracts from the parent directory (`..`). For GitHub Pages, `node scripts/stage-pages.mjs` stages the current website snapshot into `_site/`.

To validate the Abstract Explorer search behavior:

```bash
cd abstract-clusters
node test-search-mode.cjs
```

## GitHub Pages

Pushes to `main` publish the static atlas through the included GitHub Actions workflow. The workflow stages only files required by the public website.

## Attribution

Bibliographic metadata remains attributable to its original data providers and publishers. Article titles and abstracts remain the property of their respective rights holders where applicable. External metrics and badges are subject to their providers' terms.

## Weekly Update

The homepage weekly section reads `weekly-data.js`, generated from the parent vault’s weekly references and canonical organ cards. Run `python build.py --weekly-only` to refresh this section independently of the core collection snapshot; a full build also exports weekly data. No vault content is modified.

Counts represent unique newly collected paper IDs (including late discoveries and historical backfill); updates to existing papers are counted separately. JIF ranking excludes companion comments from the five featured slots, while the full weekly list retains them. The ranking uses 2025 metrics from cards, with paper ID as a stable tie-breaker. Pan-cancer / multi-organ records are shown separately from the largest specific-organ increase. Publication labels use `publication_stage`: `journal_online` → Online, `journal_issue` → Published, otherwise Unverified. Status is a captured-record assessment, not a live publisher check.

Preview with a local HTTP server on port 8765. Run `node scripts/test-weekly.cjs` with Playwright available (defaults to Edge; override `PLAYWRIGHT_CHANNEL`) for desktop/mobile, deduplication, ranking, navigation and empty-state checks. `scripts/stage-pages.mjs` includes all three weekly assets.
