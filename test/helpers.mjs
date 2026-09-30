// Shared loaders for the tests. They load the BUILT files in dist/ (npm test builds first), the same files n8n loads.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(HERE, '..')
const require = createRequire(import.meta.url)

export const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

/** The API description the node must agree with: PROMETIAM_OPENAPI, or the source repository's copy. */
export const SPEC_PATH = process.env.PROMETIAM_OPENAPI || path.resolve(ROOT, '../../public/openapi.json')
export const HAS_SPEC = fs.existsSync(SPEC_PATH)
export const SPEC_SKIP = HAS_SPEC ? false : `no OpenAPI file at ${SPEC_PATH}: set PROMETIAM_OPENAPI to a copy of public/openapi.json`
export const spec = HAS_SPEC ? JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8')) : null

function loadBuilt(relative) {
  const file = path.join(ROOT, relative)
  if (!fs.existsSync(file)) throw new Error(`${relative} is missing: run npm run build first (npm test does)`)
  return require(file)
}

export const { Prometiam } = loadBuilt('dist/nodes/Prometiam/Prometiam.node.js')
export const { PrometiamApi } = loadBuilt('dist/credentials/PrometiamApi.credentials.js')
export const { BASE_URL } = loadBuilt('dist/nodes/Prometiam/shared/constants.js')
export const nodeDescription = new Prometiam().description
export const credential = new PrometiamApi()

export const { Workflow } = require('n8n-workflow')

// ── walking the node description ────────────────────────────────────────────────────────────────

/**
 * Every property of the node with the resource and operation it is shown for:
 * { prop, path, resource, operations }, descending into collections and fixed collections.
 */
export function* walkProperties(props = nodeDescription.properties, ctx = {}, trail = '') {
  for (const prop of props) {
    const show = prop.displayOptions?.show ?? {}
    const here = {
      resource: show.resource?.[0] ?? ctx.resource,
      operations: show.operation ?? ctx.operations,
    }
    const at = trail ? `${trail}.${prop.name}` : prop.name
    yield { prop, path: at, ...here }
    if (prop.type === 'collection') yield* walkProperties(prop.options, here, at)
    if (prop.type === 'fixedCollection') {
      for (const group of prop.options) yield* walkProperties(group.values, here, `${at}.${group.name}`)
    }
  }
}

/** The operation options: { resource, value, option } with the routing that builds the request. */
export function operationOptions() {
  const out = []
  for (const { prop, resource } of walkProperties()) {
    if (prop.name !== 'operation') continue
    for (const option of prop.options) out.push({ resource, value: option.value, option })
  }
  return out
}

/** Every string in a value that starts with "=", i.e. every n8n expression, with where it sits. */
export function* expressions(node, trail = '') {
  if (typeof node === 'string') {
    if (node.startsWith('=')) yield [trail, node]
  } else if (Array.isArray(node)) {
    for (const [i, v] of node.entries()) yield* expressions(v, `${trail}[${i}]`)
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) yield* expressions(v, `${trail}.${k}`)
  }
}

/** Text a person reads in the node: display names, descriptions, placeholders, option names. */
export function* visibleStrings(node, trail = '') {
  if (Array.isArray(node)) {
    for (const [i, v] of node.entries()) yield* visibleStrings(v, `${trail}[${i}]`)
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (['displayName', 'description', 'placeholder', 'name', 'action', 'subtitle'].includes(k) && typeof v === 'string') yield [`${trail}.${k}`, v]
      else if (k !== 'routing') yield* visibleStrings(v, `${trail}.${k}`)
    }
  }
}

// ── the API description ─────────────────────────────────────────────────────────────────────────

export function specRef(ref) {
  const m = /^#\/components\/(schemas|parameters)\/(.+)$/.exec(ref)
  return spec.components[m[1]][m[2]]
}

/** The parameters of a spec operation with $refs resolved. */
export function specParameters(method, specPath) {
  const item = spec.paths[specPath]
  return [...(item.parameters || []), ...(item[method].parameters || [])].map((p) => (p.$ref ? specRef(p.$ref) : p))
}

/** Property names of a spec schema, allOf and $ref followed. */
export function specProperties(schema) {
  if (!schema) return new Set()
  if (schema.$ref) return specProperties(specRef(schema.$ref))
  const names = new Set(Object.keys(schema.properties || {}))
  for (const part of schema.allOf || []) for (const n of specProperties(part)) names.add(n)
  return names
}

/** "/companies/{{ encodeURIComponent($parameter.companyId) }}" -> { template: "/companies/{}", params: ["companyId"] } */
export function parseUrl(url) {
  const raw = url.startsWith('=') ? url.slice(1) : url
  const params = [...raw.matchAll(/\$parameter\.(\w+)/g)].map((m) => m[1])
  return { template: raw.replace(/\{\{.*?\}\}/g, '{}'), params }
}

/** Find the spec path a node URL template stands for, or undefined. */
export function findSpecPath(template) {
  return Object.keys(spec.paths).find((p) => p.replace(/\{[^}]+\}/g, '{}') === template)
}

// ── content rules ──────────────────────────────────────────────────────────────────────────────

// The deny-list of the customer-visible text lives in test/forbidden.mjs, which stays in the source repository: published,
// it would name what it keeps out. Where it is absent (the public mirror) the two content tests skip; the node's text is
// written in the source repository and scanned there before it is mirrored.
const FORBIDDEN_FILE = path.join(HERE, 'forbidden.mjs')
export const FORBIDDEN_SKIP = fs.existsSync(FORBIDDEN_FILE) ? false : 'the content deny-list is kept in the source repository'
const deny = FORBIDDEN_SKIP ? { FORBIDDEN: [], README_FORBIDDEN: null } : await import(pathToFileURL(FORBIDDEN_FILE).href)
const FORBIDDEN = deny.FORBIDDEN
export const README_FORBIDDEN = deny.README_FORBIDDEN
export const forbiddenIn = (text) => FORBIDDEN.filter((re) => re.test(text)).map(String)

