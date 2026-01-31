import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.gql?raw')) {
    const resolved = await nextResolve(specifier.replace('?raw', ''), context)
    return {
      ...resolved,
      url: resolved.url,
      format: 'module'
    }
  }
  return nextResolve(specifier, context)
}

export function load(url, context, nextLoad) {
  if (url.includes('.gql')) {
    const filePath = fileURLToPath(url.replace('?raw', ''))
    const content = readFileSync(filePath, 'utf-8')
    return {
      format: 'module',
      source: `export default ${JSON.stringify(content)}`,
      shortCircuit: true
    }
  }
  return nextLoad(url, context)
}
