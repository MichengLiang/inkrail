import path from "node:path";
import { fileURLToPath } from "node:url";

import { sampleContractIssuesForWorkspace } from "./check-workspace-contract.mjs";

async function main() {
  const rootDir = process.cwd();
  const issues = await sampleContractIssuesForWorkspace(rootDir);
  if (issues.length === 0) return;

  for (const entry of issues) {
    console.error(`${entry.code}: ${entry.detail}`);
  }
  throw new Error(`sample contract check failed with ${issues.length} issue(s)`);
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (executedPath === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
