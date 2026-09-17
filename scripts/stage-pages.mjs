import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "_site");
const files = [
  "index.html",
  "weekly.css",
  "weekly.js",
  "weekly-data.js",
  "latest.html",
  "scatter-demo.html",
  "halo-demo.html",
  "style.css",
  "scatter-demo.css",
  "halo-demo.css",
  "homepage-study.css",
  "app.js",
  "scatter-demo.js",
  "halo-demo.js",
  "homepage-study.js",
  "reading-set.js",
  "latest.js",
  "data.js",
  "journal-metrics.js",
  "organ-config.js",
  "landmark-config.js",
  "landmark-config.json",
  "data-manifest.json",
  "journal_impact_factors_2025.json",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(resolve(root, file), resolve(output, file));
await cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
await cp(resolve(root, "abstract-clusters"), resolve(output, "abstract-clusters"), { recursive: true });
await rm(resolve(output, "abstract-clusters", "README.md"), { force: true });
await rm(resolve(output, "abstract-clusters", "test-search-mode.cjs"), { force: true });
await writeFile(resolve(output, ".nojekyll"), "");

console.log(`GitHub Pages output staged at ${output}`);
