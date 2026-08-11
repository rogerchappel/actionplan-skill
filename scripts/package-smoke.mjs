#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const temporaryDirectory = await mkdtemp(join(tmpdir(), "actionplan-skill-package-smoke-"));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", temporaryDirectory], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  const [packument] = JSON.parse(output);
  const packedFiles = new Set(packument.files.map((file) => file.path));
  const requiredFiles = new Set([
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SKILL.md",
    "docs/RELEASE_VERIFICATION.md",
    "fixtures/write-request.json",
    "fixtures/blocked-request.json",
  ]);

  if (packageJson.main) {
    requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
  }

  const binEntries =
    typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {});

  for (const binEntry of binEntries) {
    requiredFiles.add(binEntry.replace(/^\.\//, ""));
  }

  const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));

  if (missing.length > 0) {
    console.error(`${packageJson.name} package smoke failed; missing packed file(s):`);
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  const tarball = join(temporaryDirectory, packument.filename);
  const installDirectory = join(temporaryDirectory, "install");
  execFileSync(
    "npm",
    ["install", "--prefix", installDirectory, "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    { stdio: "inherit" },
  );

  const executable = join(installDirectory, "node_modules", ".bin", "actionplan-skill");
  const version = execFileSync(executable, ["--version"], { encoding: "utf8" }).trim();
  if (version !== packageJson.version) {
    throw new Error(`installed CLI returned version ${version}; expected ${packageJson.version}`);
  }

  console.log(
    `${packageJson.name} package smoke passed with ${packument.files.length} packed file(s); installed CLI version ${version}.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
