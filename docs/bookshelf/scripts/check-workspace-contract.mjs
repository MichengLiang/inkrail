import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG_BOOK_XREF_PATTERN = /xref:books\/([^/\]]+)\/book\.adoc(?:#[^\[]+)?\[/g;
const XREF_PATTERN = /xref:([^\[#]+)(?:#([A-Za-z0-9_-]+))?\[/g;
const ANCHOR_PATTERN = /^\[#([A-Za-z0-9_-]+)\]$/gm;

const REQUIRED_RESOURCES = new Map([
  [
    "01-starter-book",
    [
      "books/01-starter-book/assets/images/starter-map.svg"
    ]
  ],
  [
    "03-technical-book-workflow",
    [
      "shared/images/workspace-map.svg",
      "books/03-technical-book-workflow/assets/images/technical-flow.svg",
      "books/03-technical-book-workflow/examples/minimal-tool.mjs"
    ]
  ]
]);

const REQUIRED_PATTERNS = new Map([
  [
    "00-book-anatomy",
    [
      "[abstract]",
      "[colophon]",
      "[dedication]",
      "[preface]",
      "[acknowledgments]",
      "[partintro]",
      "[appendix]",
      "[glossary]",
      "[bibliography]",
      "[index]"
    ]
  ],
  ["01-starter-book", ["[preface]", "[appendix]", "[bibliography]"]],
  ["04-reference-manual", ["[discrete]", "[glossary]"]]
]);

async function existsFile(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function readIfExists(filePath) {
  if (!await existsFile(filePath)) return "";
  return readFile(filePath, "utf8");
}

async function collectAdocFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectAdocFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".adoc")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

export async function discoverBooks(rootDir) {
  const booksDir = path.join(rootDir, "books");
  const entries = await readdir(booksDir, { withFileTypes: true });
  const books = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await existsFile(path.join(booksDir, entry.name, "book.adoc"))) {
      books.push(entry.name);
    }
  }

  return books.sort((a, b) => a.localeCompare(b));
}

export function extractCatalogBookIds(catalogSource) {
  const ids = new Set();
  for (const match of catalogSource.matchAll(CATALOG_BOOK_XREF_PATTERN)) {
    ids.add(match[1]);
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function explicitAnchors(source) {
  const anchors = new Set();
  for (const match of source.matchAll(ANCHOR_PATTERN)) {
    anchors.add(match[1]);
  }
  return anchors;
}

function partCount(bookSource) {
  const lines = bookSource.split(/\r?\n/);
  let seenTitle = false;
  let count = 0;

  for (const line of lines) {
    if (!/^= /.test(line)) continue;
    if (!seenTitle) {
      seenTitle = true;
      continue;
    }
    count += 1;
  }

  return count;
}

function issue(code, detail) {
  return { code, detail };
}

function expandedXrefTarget(target, attributes) {
  return target.replaceAll(/\{([A-Za-z0-9_-]+)\}/g, (_, name) => attributes.get(name) ?? `{${name}}`);
}

function attributesFromBookSource(bookSource) {
  const attributes = new Map();
  for (const line of bookSource.split(/\r?\n/)) {
    const match = line.match(/^:([A-Za-z0-9_-]+):\s+(.+)$/);
    if (match) attributes.set(match[1], match[2]);
  }
  return attributes;
}

async function combinedBookSource(bookDir) {
  const files = await collectAdocFiles(bookDir);
  const parts = [];
  for (const file of files) {
    parts.push(await readFile(file, "utf8"));
  }
  return parts.join("\n");
}

export async function workspaceContractIssuesForWorkspace(rootDir) {
  const issues = [];
  const books = await discoverBooks(rootDir);
  const catalogPath = path.join(rootDir, "catalog.adoc");
  const catalogSource = await readIfExists(catalogPath);
  const catalogBookIds = extractCatalogBookIds(catalogSource);
  const bookSet = new Set(books);
  const catalogBookSet = new Set(catalogBookIds);

  for (const bookId of catalogBookIds) {
    if (!bookSet.has(bookId)) {
      issues.push(issue("CATALOG_TARGET_MISSING", bookId));
    }
  }

  for (const bookId of books) {
    if (!catalogBookSet.has(bookId)) {
      issues.push(issue("BOOK_MISSING_FROM_CATALOG", bookId));
    }
  }

  for (const bookId of books) {
    const bookDir = path.join(rootDir, "books", bookId);
    const bookPath = path.join(bookDir, "book.adoc");
    const bookSource = await readFile(bookPath, "utf8");
    const allSource = await combinedBookSource(bookDir);
    const attributes = attributesFromBookSource(bookSource);

    if (!/^:doctype:\s+book$/m.test(bookSource)) {
      issues.push(issue("MISSING_DOCTYPE", bookId));
    }

    for (const match of allSource.matchAll(XREF_PATTERN)) {
      const [raw, target, anchor] = match;
      if (/^https?:/.test(target)) continue;
      const expandedTarget = expandedXrefTarget(target, attributes);
      if (!expandedTarget.endsWith(".adoc")) continue;
      const resolved = path.resolve(bookDir, expandedTarget);
      if (!await existsFile(resolved)) {
        issues.push(issue("XREF_TARGET_MISSING", `${bookId} -> ${expandedTarget}`));
        if (anchor) {
          issues.push(issue("MISSING_ANCHOR", `${bookId} -> ${expandedTarget}#${anchor}`));
        }
        continue;
      }

      if (anchor) {
        const targetDir = path.dirname(resolved);
        const targetSource = await combinedBookSource(targetDir);
        if (!explicitAnchors(targetSource).has(anchor)) {
          issues.push(issue("MISSING_ANCHOR", `${bookId} -> ${expandedTarget}#${anchor}`));
        }
      }
    }
  }

  return issues;
}

export async function sampleContractIssuesForWorkspace(rootDir) {
  const issues = [];
  const books = await discoverBooks(rootDir);

  for (const bookId of books) {
    const bookDir = path.join(rootDir, "books", bookId);
    const bookPath = path.join(bookDir, "book.adoc");
    const bookSource = await readFile(bookPath, "utf8");
    const allSource = await combinedBookSource(bookDir);

    for (const required of REQUIRED_PATTERNS.get(bookId) ?? []) {
      if (!allSource.includes(required)) {
        issues.push(issue("MISSING_REQUIRED_PATTERN", `${bookId} missing ${required}`));
      }
    }

    for (const requiredResource of REQUIRED_RESOURCES.get(bookId) ?? []) {
      if (!await existsFile(path.join(rootDir, requiredResource))) {
        issues.push(issue("MISSING_REQUIRED_RESOURCE", `${bookId} missing ${requiredResource}`));
      }
    }

    if (bookId === "01-starter-book" && partCount(bookSource) > 0) {
      issues.push(issue("UNEXPECTED_PART", bookId));
    }

    if (bookId === "02-multipart-monograph") {
      if (partCount(bookSource) < 2) {
        issues.push(issue("MISSING_PARTS", bookId));
      }
      if ((allSource.match(/\[partintro\]/g) ?? []).length < 2) {
        issues.push(issue("MISSING_PARTINTRO", bookId));
      }
    }

    if (bookId === "03-technical-book-workflow") {
      if (!/\[(mermaid|plantuml),/m.test(allSource)) {
        issues.push(issue("MISSING_DIAGRAM_BLOCK", bookId));
      }
      if (!/include::\.\.\/examples\/minimal-tool\.mjs\[tag=main\]/.test(allSource)) {
        issues.push(issue("MISSING_CODE_INCLUDE", bookId));
      }
    }

    if (bookId === "04-reference-manual") {
      if (!/\[cols=.*options="header"\]/.test(allSource)) {
        issues.push(issue("MISSING_TABLE", bookId));
      }
      if (!/^[^:\n]+::\s+/m.test(allSource)) {
        issues.push(issue("MISSING_DEFINITION_LIST", bookId));
      }
      if (!/xref:\.\.\/0[0-9]-[^/\]]+\/book\.adoc/.test(allSource)) {
        issues.push(issue("MISSING_SAMPLE_XREF", bookId));
      }
    }

    if (bookId === "05-upper-volume" && !explicitAnchors(allSource).has("upper-core-model")) {
      issues.push(issue("MISSING_REQUIRED_ANCHOR", "05-upper-volume#upper-core-model"));
    }

    if (bookId === "06-lower-volume") {
      if (!/^:upper-book:\s+\.\.\/05-upper-volume\/book\.adoc$/m.test(bookSource)) {
        issues.push(issue("MISSING_UPPER_BOOK_ATTRIBUTE", bookId));
      }
      if (!/xref:\{upper-book\}#upper-core-model\[/.test(allSource)) {
        issues.push(issue("MISSING_UPPER_VOLUME_XREF", bookId));
      }
    }
  }

  return issues;
}

export async function contractIssuesForWorkspace(rootDir) {
  return [
    ...await workspaceContractIssuesForWorkspace(rootDir),
    ...await sampleContractIssuesForWorkspace(rootDir)
  ];
}

async function main() {
  const rootDir = process.cwd();
  const issues = await workspaceContractIssuesForWorkspace(rootDir);
  if (issues.length === 0) return;

  for (const entry of issues) {
    console.error(`${entry.code}: ${entry.detail}`);
  }
  throw new Error(`workspace contract check failed with ${issues.length} issue(s)`);
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (executedPath === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
