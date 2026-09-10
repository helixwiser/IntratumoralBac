# Abstract Explorer

Production copy of the approved `research-map/abstract-clusters` interface.
The homepage links to `abstract-clusters/index.html`; Overview returns to the site root.
`build.py` copies this directory into the static output, excluding tests and this file.

The current snapshot contains 720 abstracts. Preserve alignment between `payload.js`
and `framework-data.js` when updating the corpus. Classifications and research action
markers are abstract-level automated matches, not full-text evidence assessments.

The default view uses Greys for the similarity matrix, with Feature statistics beside
it and the Research actions table below. Search hides both visualizations and lists
all papers with similarity strictly greater than 0.7, including the selected paper.
The actions table uses the same complete ordered set, without a result cap.

Run `node test-search-mode.cjs` from this directory to check threshold boundaries,
result parity, source inclusion, and clearing / no-match behavior.
