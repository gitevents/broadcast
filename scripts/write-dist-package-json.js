// The root package.json sets "type": "module", which would otherwise make Node
// interpret every .js file under dist/ as ESM. ncc emits CommonJS, and the
// workflows load the bundle with github-script's require(), so each output
// directory needs its own package.json pinning the module type.
//
// This also overwrites the package.json ncc copies in as an asset when it
// bundles a dependency that ships one (previously playwright-core's).

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]

if (!dir) {
  throw new Error('usage: node scripts/write-dist-package-json.js <dist-dir>')
}

const bundle = readFileSync(join(dir, 'index.js'), 'utf8')

// ncc emits a single bundle; detect its format rather than assuming one.
const isEsm = /^\s*(import|export)\s/m.test(bundle)
const type = isEsm ? 'module' : 'commonjs'

writeFileSync(
  join(dir, 'package.json'),
  `${JSON.stringify({ type }, null, 2)}\n`
)

console.log(`${dir}/package.json -> {"type":"${type}"}`)
