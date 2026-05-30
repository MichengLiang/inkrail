import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
const docsPackage = JSON.parse(await readFile("docs/bookshelf/package.json", "utf8"));
const npmPackage = JSON.parse(
  await readFile("packages/inkrail/package.json", "utf8"),
);
const book = await readFile(
  "docs/bookshelf/books/10-inkrail-cli-design/book.adoc",
  "utf8",
);

const version = rootPackage.version;
const mismatches = [
  ["docs/bookshelf/package.json", docsPackage.version],
  ["packages/inkrail/package.json", npmPackage.version],
].filter(([, candidate]) => candidate !== version);

if (!book.includes(`v${version}, 2026-05`)) {
  mismatches.push([
    "docs/bookshelf/books/10-inkrail-cli-design/book.adoc",
    "missing matching book version",
  ]);
}

if (mismatches.length > 0) {
  for (const [filePath, candidate] of mismatches) {
    console.error(`${filePath} version mismatch: ${candidate} !== ${version}`);
  }
  process.exit(1);
}
