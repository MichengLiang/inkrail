import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  contractIssuesForWorkspace,
  discoverBooks,
  extractCatalogBookIds,
  sampleContractIssuesForWorkspace,
  workspaceContractIssuesForWorkspace
} from "../scripts/check-workspace-contract.mjs";

async function writeAdoc(filePath, lines) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, lines.join("\n"), "utf8");
}

async function createMinimalBook(root, bookId, bodyLines = ["== Chapter", "Text."]) {
  await writeAdoc(path.join(root, "books", bookId, "book.adoc"), [
    `= ${bookId}`,
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    ...bodyLines
  ]);
}

test("discoverBooks finds sorted books that contain book.adoc", async () => {
  const root = path.resolve("tmp", "test-fixtures", `contract-books-${randomUUID()}`);
  await createMinimalBook(root, "02-second");
  await createMinimalBook(root, "01-first");
  await mkdir(path.join(root, "books", "notes-only"), { recursive: true });

  assert.deepEqual(await discoverBooks(root), ["01-first", "02-second"]);
});

test("extractCatalogBookIds reads book links from catalog xrefs", () => {
  const catalog = [
    "= Catalog",
    "",
    "* xref:books/00-book-anatomy/book.adoc[00]",
    "|xref:books/01-starter-book/book.adoc[01]",
    "* xref:https://example.com[external]"
  ].join("\n");

  assert.deepEqual(extractCatalogBookIds(catalog), [
    "00-book-anatomy",
    "01-starter-book"
  ]);
});

test("workspaceContractIssuesForWorkspace reports reusable catalog, doctype, xref, and anchor issues", async () => {
  const root = path.resolve("tmp", "test-fixtures", `contract-issues-${randomUUID()}`);
  await writeAdoc(path.join(root, "catalog.adoc"), [
    "= Catalog",
    "",
    "* xref:books/00-book-anatomy/book.adoc[00]",
    "* xref:books/06-lower-volume/book.adoc[06]",
    "* xref:books/missing-book/book.adoc[missing]"
  ]);
  await writeAdoc(path.join(root, "books", "00-book-anatomy", "book.adoc"), [
    "= Anatomy",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    "[abstract]",
    "== Abstract",
    "Text."
  ]);
  await writeAdoc(path.join(root, "books", "06-lower-volume", "book.adoc"), [
    "= Lower",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    "",
    ":upper-book: ../05-upper-volume/book.adoc",
    "",
    "== Opening",
    "See xref:{upper-book}#upper-core-model[upper]."
  ]);
  await createMinimalBook(root, "unlisted-book");

  const issues = await workspaceContractIssuesForWorkspace(root);

  assert.deepEqual(
    issues.map((issue) => `${issue.code}:${issue.detail}`).sort(),
    [
      "BOOK_MISSING_FROM_CATALOG:unlisted-book",
      "CATALOG_TARGET_MISSING:missing-book",
      "MISSING_ANCHOR:06-lower-volume -> ../05-upper-volume/book.adoc#upper-core-model",
      "MISSING_DOCTYPE:06-lower-volume",
      "XREF_TARGET_MISSING:06-lower-volume -> ../05-upper-volume/book.adoc"
    ]
  );
});

test("sampleContractIssuesForWorkspace reports canonical sample coverage issues", async () => {
  const root = path.resolve("tmp", "test-fixtures", `sample-contract-issues-${randomUUID()}`);
  await writeAdoc(path.join(root, "catalog.adoc"), [
    "= Catalog",
    "",
    "* xref:books/00-book-anatomy/book.adoc[00]"
  ]);
  await writeAdoc(path.join(root, "books", "00-book-anatomy", "book.adoc"), [
    "= Anatomy",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    "[abstract]",
    "== Abstract",
    "Text."
  ]);

  const issues = await sampleContractIssuesForWorkspace(root);

  assert.deepEqual(
    issues.map((issue) => `${issue.code}:${issue.detail}`).sort(),
    [
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [acknowledgments]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [appendix]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [bibliography]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [colophon]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [dedication]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [glossary]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [index]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [partintro]",
      "MISSING_REQUIRED_PATTERN:00-book-anatomy missing [preface]"
    ]
  );
});

test("contractIssuesForWorkspace resolves xrefs from the book entry directory", async () => {
  const root = path.resolve("tmp", "test-fixtures", `contract-xref-entry-${randomUUID()}`);
  await writeAdoc(path.join(root, "catalog.adoc"), [
    "= Catalog",
    "",
    "* xref:books/01-source/book.adoc[Source]",
    "* xref:books/02-target/book.adoc[Target]"
  ]);
  await writeAdoc(path.join(root, "books", "01-source", "book.adoc"), [
    "= Source",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    "include::chapters/01-link.adoc[]"
  ]);
  await writeAdoc(path.join(root, "books", "01-source", "chapters", "01-link.adoc"), [
    "== Link",
    "",
    "See xref:../02-target/book.adoc#target-anchor[target]."
  ]);
  await writeAdoc(path.join(root, "books", "02-target", "book.adoc"), [
    "= Target",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    "[#target-anchor]",
    "== Target Anchor"
  ]);

  const issues = await contractIssuesForWorkspace(root);

  assert.deepEqual(issues, []);
});

test("workspaceContractIssuesForWorkspace stays useful after deleting canonical samples", async () => {
  const root = path.resolve("tmp", "test-fixtures", `reusable-contract-${randomUUID()}`);
  await writeAdoc(path.join(root, "catalog.adoc"), [
    "= Catalog",
    "",
    "* xref:books/my-book/book.adoc[My Book]"
  ]);
  await createMinimalBook(root, "my-book");

  assert.deepEqual(await workspaceContractIssuesForWorkspace(root), []);
});

test("sampleContractIssuesForWorkspace reports missing required sample resources", async () => {
  const root = path.resolve("tmp", "test-fixtures", `contract-required-resources-${randomUUID()}`);
  await writeAdoc(path.join(root, "catalog.adoc"), [
    "= Catalog",
    "",
    "* xref:books/03-technical-book-workflow/book.adoc[03]"
  ]);
  await writeAdoc(path.join(root, "books", "03-technical-book-workflow", "book.adoc"), [
    "= Technical",
    "Author <author@example.com>",
    "v0.1, 2026-05",
    ":doctype: book",
    "",
    "include::../../shared/attributes.adoc[]",
    "",
    "== Flow",
    "",
    "image::../../shared/images/workspace-map.svg[workspace]",
    "",
    "[mermaid,flow,svg]",
    "....",
    "flowchart LR",
    "....",
    "",
    "include::../examples/minimal-tool.mjs[tag=main]"
  ]);

  const issues = await sampleContractIssuesForWorkspace(root);

  assert.deepEqual(
    issues.map((issue) => `${issue.code}:${issue.detail}`).sort(),
    [
      "MISSING_REQUIRED_RESOURCE:03-technical-book-workflow missing books/03-technical-book-workflow/assets/images/technical-flow.svg",
      "MISSING_REQUIRED_RESOURCE:03-technical-book-workflow missing books/03-technical-book-workflow/examples/minimal-tool.mjs",
      "MISSING_REQUIRED_RESOURCE:03-technical-book-workflow missing shared/images/workspace-map.svg"
    ]
  );
});
