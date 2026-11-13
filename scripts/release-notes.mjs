// Prints the notes for a GitHub release: the version's section of CHANGELOG.md, followed by how to
// install the packages. Fails if a package's version doesn't match the tag or the changelog has no
// section for it.
//
// Usage: node scripts/release-notes.mjs v0.1.0
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tag = process.argv[2] ?? '';

const fail = (message) => {
  console.error(`release-notes: ${message}`);
  process.exit(1);
};

if (!/^v\d+\.\d+\.\d+(-[\w.]+)?$/.test(tag)) fail(`expected a tag like v0.1.0, got "${tag}"`);
const version = tag.slice(1);

// Packages

const packages = readdirSync(join(root, 'packages'))
  .map((name) => join(root, 'packages', name, 'package.json'))
  .filter((file) => existsSync(file))
  .map((file) => JSON.parse(readFileSync(file, 'utf8')))
  .filter((pkg) => !pkg.private);

for (const pkg of packages) {
  if (pkg.version !== version) fail(`${pkg.name} is ${pkg.version}, but the tag is ${tag}`);
}

// Changelog section: from "## [version]" up to the next heading or the link references at the end

const lines = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').split('\n');
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (start === -1) fail(`CHANGELOG.md has no "## [${version}]" section`);
const length = lines
  .slice(start + 1)
  .findIndex((line) => line.startsWith('## ') || /^\[[^\]]+\]: /.test(line));
const section = lines
  .slice(start + 1, length === -1 ? undefined : start + 1 + length)
  .join('\n')
  .trim();

// Install instructions: only the packages an app imports itself. The ones other packages depend on
// come along as dependencies.

const dependedOn = new Set(packages.flatMap((pkg) => Object.keys(pkg.dependencies ?? {})));
const direct = packages.filter((pkg) => !dependedOn.has(pkg.name));

const install = `## Install

\`\`\`sh
pnpm add ${direct.map((pkg) => pkg.name).join(' ')}
\`\`\`

The tarballs attached to this release are the same files published to npm.`;

console.log(`${section}\n\n${install}`);
