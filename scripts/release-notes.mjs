// Prints the notes for a GitHub release: the version's section of CHANGELOG.md, followed by how to
// install the tarballs attached to the release. Fails if a package's version doesn't match the tag
// or the changelog has no section for it.
//
// Usage: node scripts/release-notes.mjs v0.1.0
// The repository in the download links comes from GITHUB_REPOSITORY, which GitHub Actions sets.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tag = process.argv[2] ?? '';
const repo = process.env.GITHUB_REPOSITORY ?? 'LegenLee/rio';

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

// Install instructions. Packages that others depend on go in overrides, because their dependents
// ask for a version range, which a package manager would otherwise look up on npm.

const url = (name) =>
  `https://github.com/${repo}/releases/download/${tag}/${name.slice(1).replace('/', '-')}-${version}.tgz`;
const dependedOn = new Set(packages.flatMap((pkg) => Object.keys(pkg.dependencies ?? {})));
const direct = packages.filter((pkg) => !dependedOn.has(pkg.name));
const overridden = packages.filter((pkg) => dependedOn.has(pkg.name));

const install = `## Install

Rio isn't on npm. Install the tarballs attached to this release. The packages depend on each other by version range, so point those dependencies at the tarballs too, or the package manager will look for them on npm.

\`package.json\`:

\`\`\`json
{
  "dependencies": {
${direct.map((pkg) => `    "${pkg.name}": "${url(pkg.name)}"`).join(',\n')}
  }
}
\`\`\`

\`pnpm-workspace.yaml\` (pnpm 11 no longer reads overrides from \`package.json\`; with npm, put the same map in \`"overrides"\` in \`package.json\`):

\`\`\`yaml
overrides:
${overridden.map((pkg) => `  '${pkg.name}': ${url(pkg.name)}`).join('\n')}
\`\`\``;

console.log(`${section}\n\n${install}`);
