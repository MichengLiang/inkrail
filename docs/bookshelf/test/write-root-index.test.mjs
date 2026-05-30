import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { writeRootIndex } from "../scripts/write-root-index.mjs";

test("writeRootIndex writes a root redirect to catalog.html", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "asciidoc-root-index-"));

  const output = await writeRootIndex(dir);
  const html = await readFile(output, "utf8");

  assert.equal(output, path.join(dir, "index.html"));
  assert.match(html, /<meta http-equiv="refresh" content="0; url=catalog.html">/);
  assert.match(html, /<a href="catalog.html">catalog\.html<\/a>/);
});
