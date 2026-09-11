# IntratumoralBac

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

To validate the Abstract Explorer search behavior:

```bash
cd abstract-clusters
node test-search-mode.cjs
```

## GitHub Pages

Pushes to `main` publish the static atlas through the included GitHub Actions workflow. The workflow stages only files required by the public website.

## Attribution

Bibliographic metadata remains attributable to its original data providers and publishers. Article titles and abstracts remain the property of their respective rights holders where applicable. External metrics and badges are subject to their providers' terms.
