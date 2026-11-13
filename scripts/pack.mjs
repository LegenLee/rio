// Packs every published package into `release/`, as the tarballs attached to a GitHub release.
// Build first: `pnpm release:pack` builds and then runs this.
//
// Each tarball gets the repository's LICENSE and NOTICE. Apache-2.0 asks for both with every copy,
// and the NOTICE credits material-color-utilities, which `@rio-m3e/tokens` bundles.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'release');
const LEGAL = ['LICENSE', 'NOTICE'];

const packages = readdirSync(join(root, 'packages'))
  .map((name) => join(root, 'packages', name))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .filter((dir) => !JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).private);

rmSync(out, { recursive: true, force: true });
mkdirSync(out);

for (const dir of packages) {
  for (const file of LEGAL) copyFileSync(join(root, file), join(dir, file));
  try {
    execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'inherit' });
  } finally {
    for (const file of LEGAL) rmSync(join(dir, file));
  }
}
