// The package as npm and n8n see it: package.json, the files it points at, what is (not) shipped.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pkg, ROOT, nodeDescription, credential, forbiddenIn, FORBIDDEN_SKIP, README_FORBIDDEN } from './helpers.mjs'

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8')

test('package.json follows the n8n community-node conventions', () => {
  assert.equal(pkg.name, 'n8n-nodes-prometiam')
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/)
  assert.ok(pkg.keywords.includes('n8n-community-node-package'))
  assert.equal(pkg.license, 'MIT')
  assert.deepEqual(pkg.files, ['dist'])
  assert.equal(pkg.n8n.n8nNodesApiVersion, 1)
  assert.equal(pkg.n8n.strict, true)
  assert.deepEqual(pkg.n8n.credentials, ['dist/credentials/PrometiamApi.credentials.js'])
  assert.deepEqual(pkg.n8n.nodes, ['dist/nodes/Prometiam/Prometiam.node.js'])
  assert.equal(pkg.peerDependencies['n8n-workflow'], '*')
  assert.ok(pkg.description.length > 40)
  assert.equal(pkg.author.name, 'Prometiam')
})

test('there are no runtime dependencies (a requirement for n8n Cloud verification)', () => {
  assert.equal(pkg.dependencies, undefined)
  for (const name of ['n8n-workflow', '@n8n/node-cli', 'typescript']) {
    assert.ok(pkg.devDependencies[name] || pkg.peerDependencies[name], name)
  }
})

test('the build scripts are the n8n ones, and npm test builds before it tests', () => {
  assert.equal(pkg.scripts.build, 'n8n-node build')
  assert.equal(pkg.scripts.lint, 'n8n-node lint')
  assert.equal(pkg.scripts.release, 'n8n-node release')
  assert.match(pkg.scripts.test, /^npm run build && node --test /)
})

test('every file the n8n section points at exists in dist', () => {
  for (const file of [...pkg.n8n.credentials, ...pkg.n8n.nodes]) assert.ok(fs.existsSync(path.join(ROOT, file)), file)
})

test('the icons and the codex file are built next to the node', () => {
  const icon = nodeDescription.icon
  assert.ok(icon.light.startsWith('file:') && icon.dark.startsWith('file:'))
  const nodeDir = path.join(ROOT, 'dist/nodes/Prometiam')
  for (const ref of [icon.light, icon.dark, credential.icon.light, credential.icon.dark]) {
    const base = ref.startsWith('file:../../') ? nodeDir : path.join(ROOT, 'dist/credentials')
    const file = path.resolve(base, ref.replace('file:', ''))
    assert.ok(fs.existsSync(file), `${ref} -> ${file}`)
    assert.match(fs.readFileSync(file, 'utf8'), /^<svg[\s\S]*<\/svg>\s*$/)
  }
  const codex = JSON.parse(fs.readFileSync(path.join(nodeDir, 'Prometiam.node.json'), 'utf8'))
  assert.equal(codex.node, 'n8n-nodes-prometiam.prometiam')
  assert.ok(codex.categories.length >= 1)
  assert.ok(codex.resources.primaryDocumentation[0].url.startsWith('https://www.prometiam.com/'))
  assert.ok(codex.resources.credentialDocumentation[0].url.startsWith('https://www.prometiam.com/'))
})

test('the folder keeps node_modules and dist out of git', () => {
  const ignore = read('.gitignore').split('\n').map((l) => l.trim())
  assert.ok(ignore.includes('node_modules'))
  assert.ok(ignore.includes('dist'))
})

test('no file holds a key-shaped string', () => {
  const files = []
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (['node_modules', 'dist'].includes(name)) continue
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) walk(full)
      else files.push(full)
    }
  }
  walk(ROOT)
  assert.ok(files.length > 20)
  for (const file of files) {
    if (file.endsWith('package-lock.json')) continue
    const text = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(text, /rk_(?:live|test)_[A-Za-z0-9]{6,}/, `${path.relative(ROOT, file)} holds a key-shaped string`)
  }
})

test('customer-visible text names no data source, pipeline internal or record count', { skip: FORBIDDEN_SKIP }, () => {
  const bad = []
  for (const [where, text] of Object.entries({ description: pkg.description, keywords: pkg.keywords.join(' '), readme: read('README.md') })) {
    for (const re of forbiddenIn(text)) bad.push(`${where}: ${re}`)
  }
  for (const file of ['credentials/PrometiamApi.credentials.ts']) for (const re of forbiddenIn(read(file))) bad.push(`${file}: ${re}`)
  assert.deepEqual(bad, [])
  const readme = read('README.md')
  assert.doesNotMatch(readme, README_FORBIDDEN, 'README.md is customer-facing')
})
