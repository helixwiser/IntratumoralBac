# IntratumoralBac website

This repository is the website-only Codex project. Its root is also the Git repository published at `helixwiser/IntratumoralBac`.

- Work on layout, interaction, static assets, and deployment here.
- The literature/Obsidian project is the parent (`..`) directory. Do not edit literature cards, search strategy, or metric snapshots for a website-only request.
- Website data files are generated snapshots. When the user requests a data update, read the corresponding literature source and run `build.py`, then verify the generated diff before publishing.
- GitHub Pages is published from `main` by `.github/workflows/pages.yml`; `scripts/stage-pages.mjs` stages only public site files.
- `.openai/hosting.json` belongs to the existing Sites deployment. Keep its project ID intact if that site is updated.
- The Abstract Explorer is in `abstract-clusters/`; run its search regression check from that directory with `node test-search-mode.cjs`.
