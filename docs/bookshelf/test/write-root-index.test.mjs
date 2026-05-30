import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { writeRootIndex } from "../scripts/write-root-index.mjs";

test("writeRootIndex writes a root redirect to the inkrail CLI design book", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "asciidoc-root-index-"));

  const output = await writeRootIndex(dir);
  const html = await readFile(output, "utf8");
  const defaultBookPath = "books/10-inkrail-cli-design/book.html";

  assert.equal(output, path.join(dir, "index.html"));
  assert.match(
    html,
    new RegExp(`<meta http-equiv="refresh" content="0; url=${defaultBookPath}">`),
  );
  assert.match(html, new RegExp(`<link rel="canonical" href="${defaultBookPath}">`));
  assert.match(html, new RegExp(`<a href="${defaultBookPath}">inkrail CLI 设计书</a>`));
});
