import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function writeRootIndex(outputDir) {
  await mkdir(outputDir, { recursive: true });
  const output = path.join(outputDir, "index.html");
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=catalog.html">
  <title>AsciiDoc Multi-Book Workspace</title>
</head>
<body>
  <p><a href="catalog.html">catalog.html</a></p>
</body>
</html>
`;
  await writeFile(output, html, "utf8");
  return output;
}

async function main() {
  const outputDir = process.argv[2] ?? path.join(process.cwd(), "build", "html");
  await writeRootIndex(path.resolve(outputDir));
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (executedPath === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
