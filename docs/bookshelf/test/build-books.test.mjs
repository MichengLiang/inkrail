import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  asciidoctorArgsForBook,
  buildBooksForWorkspace,
  buildPlanForWorkspace
} from "../scripts/build-books.mjs";

test("buildPlanForWorkspace finds book.adoc entries and maps each to its own output directory", async () => {
  const root = path.resolve("tmp", "test-fixtures", `multi-book-${randomUUID()}`);
  await mkdir(path.join(root, "books", "01-foundations"), { recursive: true });
  await mkdir(path.join(root, "books", "02-practice"), { recursive: true });
  await mkdir(path.join(root, "books", "notes-only"), { recursive: true });
  await writeFile(path.join(root, "books", "01-foundations", "book.adoc"), "= Foundations\n");
  await writeFile(path.join(root, "books", "02-practice", "book.adoc"), "= Practice\n");

  const plan = await buildPlanForWorkspace(root);

  assert.deepEqual(
    plan.map((entry) => ({
      bookId: entry.bookId,
      input: path.relative(root, entry.input),
      outputDir: path.relative(root, entry.outputDir)
    })),
    [
      {
        bookId: "01-foundations",
        input: path.join("books", "01-foundations", "book.adoc"),
        outputDir: path.join("build", "html", "books", "01-foundations")
      },
      {
        bookId: "02-practice",
        input: path.join("books", "02-practice", "book.adoc"),
        outputDir: path.join("build", "html", "books", "02-practice")
      }
    ]
  );
});

test("asciidoctorArgsForBook loads Kroki and fetches diagram images at build time", () => {
  const book = {
    outputDir: path.resolve("tmp", "test-fixtures", "html", "books", "01-foundations")
  };

  assert.deepEqual(asciidoctorArgsForBook(book), [
    "book.adoc",
    "-r",
    "asciidoctor-kroki",
    "-a",
    "kroki-fetch-diagram",
    "-a",
    "kroki-http-method=post",
    "-D",
    book.outputDir
  ]);
});

test("buildBooksForWorkspace removes stale book HTML output directories before rendering current books", async () => {
  const root = path.resolve("tmp", "test-fixtures", `multi-book-html-clean-${randomUUID()}`);
  const bookDir = path.join(root, "books", "01-current");
  const staleDir = path.join(root, "build", "html", "books", "stale-book");
  await mkdir(bookDir, { recursive: true });
  await mkdir(staleDir, { recursive: true });
  await writeFile(path.join(bookDir, "book.adoc"), "= Current\n:doctype: book\n\n== Chapter\nText.\n");
  await writeFile(path.join(staleDir, "book.html"), "<html>stale</html>");

  await buildBooksForWorkspace(root, () => {});

  await assert.rejects(
    () => readFile(path.join(staleDir, "book.html"), "utf8"),
    /ENOENT/
  );
});
