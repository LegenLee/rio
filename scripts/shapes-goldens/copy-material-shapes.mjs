// Copies Compose Material3's MaterialShapes.kt into the generator, without its Compose-only parts.
// ComposeCompat.kt stands in for the Compose types the rest of it uses.
//
//   node copy-material-shapes.mjs <androidx checkout>/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [source] = process.argv.slice(2);
if (!source) throw new Error('Usage: node copy-material-shapes.mjs <path to MaterialShapes.kt>');

const text = readFileSync(source, 'utf8');
const packageAt = text.indexOf('package androidx.compose.material3');
const header = text.slice(0, packageAt);
let body = text.slice(packageAt);

// Drop the Compose-only path and shape helpers: everything from the first public extension up to
// the MaterialShapes class, keeping the class's own KDoc.
// The first extension starts at its own KDoc, above its annotation.
const start = body.lastIndexOf(
  '/**',
  body.indexOf('@ExperimentalMaterial3ExpressiveApi\npublic fun Morph.toPath'),
);
const cls = body.indexOf('public sealed class MaterialShapes');
const kdoc = body.lastIndexOf('/**', cls);
if (start < 0 || cls < 0 || kdoc < start) throw new Error('MaterialShapes.kt changed shape');
body = body.slice(0, start) + body.slice(kdoc);

// Imports of the Compose types that ComposeCompat.kt replaces, or that nothing uses any more
const dropped = [
  'androidx.compose.material3.internal.',
  'androidx.compose.runtime.',
  'androidx.compose.ui.',
];
body = body
  .split('\n')
  .filter(
    (line) => !(line.startsWith('import ') && dropped.some((p) => line.slice(7).startsWith(p))),
  )
  .join('\n');

const note = `/*
 * Copied from androidx 079e2e3, compose/material3/material3/src/commonMain/kotlin/androidx/
 * compose/material3/MaterialShapes.kt, by copy-material-shapes.mjs. Changed: the Compose-only
 * toPath and toShape extensions and the Compose imports are removed; ComposeCompat.kt stands in
 * for Offset, Matrix, fastMap, and transformed(Matrix).
 */

`;
const out = join(dirname(fileURLToPath(import.meta.url)), 'src/main/kotlin/MaterialShapes.kt');
writeFileSync(out, header + note + body);
