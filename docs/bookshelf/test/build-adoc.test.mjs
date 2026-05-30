import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  adocBuildPlanForWorkspace,
  buildAdocForWorkspace
} from "../scripts/build-adoc.mjs";

test("adocBuildPlanForWorkspace maps catalog and each book to the adoc output tree", async () => {
  const root = path.resolve("tmp", "test-fixtures", `multi-book-adoc-plan-${randomUUID()}`);
  await mkdir(path.join(root, "books", "01-foundations"), { recursive: true });
  await mkdir(path.join(root, "books", "02-practice"), { recursive: true });
  await mkdir(path.join(root, "books", "notes-only"), { recursive: true });
  await writeFile(path.join(root, "catalog.adoc"), "= Catalog\n");
  await writeFile(path.join(root, "books", "01-foundations", "book.adoc"), "= Foundations\n");
  await writeFile(path.join(root, "books", "02-practice", "book.adoc"), "= Practice\n");

  const plan = await adocBuildPlanForWorkspace(root);

  assert.deepEqual(
    plan.map((entry) => ({
      kind: entry.kind,
      bookId: entry.bookId,
      input: path.relative(root, entry.input),
      output: path.relative(root, entry.output)
    })),
    [
      {
        kind: "catalog",
        bookId: null,
        input: "catalog.adoc",
        output: path.join("build", "adoc", "catalog.adoc")
      },
      {
        kind: "book",
        bookId: "01-foundations",
        input: path.join("books", "01-foundations", "book.adoc"),
        output: path.join("build", "adoc", "books", "01-foundations.adoc")
      },
      {
        kind: "book",
        bookId: "02-practice",
        input: path.join("books", "02-practice", "book.adoc"),
        output: path.join("build", "adoc", "books", "02-practice.adoc")
      }
    ]
  );
});

test("buildAdocForWorkspace writes pure text outputs while preserving cross-book xrefs", async () => {
  const root = path.resolve("tmp", "test-fixtures", `multi-book-adoc-build-${randomUUID()}`);
  const foundationsDir = path.join(root, "books", "01-foundations");
  const practiceDir = path.join(root, "books", "02-practice");
  await mkdir(path.join(root, "shared"), { recursive: true });
  await mkdir(path.join(foundationsDir, "chapters"), { recursive: true });
  await mkdir(path.join(practiceDir, "chapters"), { recursive: true });
  await writeFile(path.join(root, "shared", "attributes.adoc"), ":series-name: Multi Book Fixture\n");
  await writeFile(
    path.join(root, "catalog.adoc"),
    [
      "= Catalog",
      "",
      "* xref:books/01-foundations/book.adoc[Foundations]",
      "* xref:books/02-practice/book.adoc[Practice]"
    ].join("\n")
  );
  await writeFile(
    path.join(foundationsDir, "book.adoc"),
    [
      "= Foundations",
      ":doctype: book",
      "",
      "include::../../shared/attributes.adoc[]",
      "",
      "include::chapters/01-opening.adoc[]"
    ].join("\n")
  );
  await writeFile(path.join(foundationsDir, "chapters", "01-opening.adoc"), "[#book-boundary]\n== Book Boundary\nText.\n");
  await writeFile(
    path.join(practiceDir, "book.adoc"),
    [
      "= Practice",
      ":doctype: book",
      ":foundations-book: ../01-foundations/book.adoc",
      "",
      "include::../../shared/attributes.adoc[]",
      "",
      "include::chapters/01-reference.adoc[]"
    ].join("\n")
  );
  await writeFile(
    path.join(practiceDir, "chapters", "01-reference.adoc"),
    "== Reference\nSee xref:{foundations-book}#book-boundary[book boundary].\n"
  );

  await buildAdocForWorkspace(root);

  const catalog = await readFile(path.join(root, "build", "adoc", "catalog.adoc"), "utf8");
  const foundations = await readFile(path.join(root, "build", "adoc", "books", "01-foundations.adoc"), "utf8");
  const practice = await readFile(path.join(root, "build", "adoc", "books", "02-practice.adoc"), "utf8");

  assert.match(catalog, /xref:books\/01-foundations\/book\.adoc/);
  assert.match(foundations, /:series-name: Multi Book Fixture/);
  assert.match(foundations, /== Book Boundary/);
  assert.match(practice, /:series-name: Multi Book Fixture/);
  assert.match(practice, /xref:\{foundations-book\}#book-boundary/);
  assert.doesNotMatch(`${catalog}\n${foundations}\n${practice}`, /^[ \t]*include::/m);
});

test("buildAdocForWorkspace removes stale reduced book outputs before writing current books", async () => {
  const root = path.resolve("tmp", "test-fixtures", `multi-book-adoc-clean-${randomUUID()}`);
  await mkdir(path.join(root, "books", "01-current"), { recursive: true });
  await mkdir(path.join(root, "build", "adoc", "books"), { recursive: true });
  await writeFile(path.join(root, "catalog.adoc"), "= Catalog\n");
  await writeFile(path.join(root, "books", "01-current", "book.adoc"), "= Current\n:doctype: book\n");
  await writeFile(path.join(root, "build", "adoc", "books", "stale.adoc"), "= Stale\n");

  await buildAdocForWorkspace(root);

  await assert.rejects(
    () => readFile(path.join(root, "build", "adoc", "books", "stale.adoc"), "utf8"),
    /ENOENT/
  );
});
