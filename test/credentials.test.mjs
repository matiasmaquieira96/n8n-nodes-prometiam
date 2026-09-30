// The credential: what the user types, how it is sent, and the request n8n makes to test it.
import test from 'node:test'
import assert from 'node:assert/strict'
import { credential, nodeDescription, BASE_URL, spec, SPEC_SKIP, Workflow, specParameters } from './helpers.mjs'

test('the credential is the one the node asks for, with a masked required API key', () => {
  assert.equal(credential.name, 'prometiamApi')
  assert.equal(credential.name, nodeDescription.credentials[0].name)
  assert.equal(credential.displayName, 'Prometiam API')
  assert.match(credential.documentationUrl, /^https:\/\/www\.prometiam\.com\//)
  assert.equal(credential.properties.length, 1)
  const [key] = credential.properties
  assert.equal(key.name, 'apiKey')
  assert.equal(key.type, 'string')
  assert.equal(key.typeOptions.password, true)
  assert.equal(key.required, true)
  assert.equal(key.default, '')
})

test('the key is sent as a Bearer token, which is the scheme the API documents', { skip: SPEC_SKIP }, () => {
  const scheme = Object.values(spec.components.securitySchemes)[0]
  assert.equal(scheme.type, 'http')
  assert.equal(scheme.scheme, 'bearer')
  assert.equal(credential.authenticate.type, 'generic')
  assert.deepEqual(Object.keys(credential.authenticate.properties), ['headers'])
  assert.deepEqual(credential.authenticate.properties.headers, { Authorization: '=Bearer {{$credentials.apiKey}}' })
})

test('the Authorization expression evaluates to "Bearer <key>" in n8n\'s expression engine', () => {
  const node = { id: '1', name: 'T', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} }
  const nodeTypes = { getByName: () => ({ description: { properties: [] } }), getByNameAndVersion: () => ({ description: { properties: [], version: 1 } }), getKnownTypes: () => ({}) }
  const wf = new Workflow({ id: 'w', nodes: [node], connections: {}, active: false, nodeTypes })
  const header = wf.expression.getParameterValue(credential.authenticate.properties.headers.Authorization, null, 0, 0, 'T', [], 'manual', { $credentials: { apiKey: 'PLACEHOLDER_KEY' } })
  assert.equal(header, 'Bearer PLACEHOLDER_KEY')
})

test('the credential test is a cheap GET on a real endpoint of the same host as the node', { skip: SPEC_SKIP }, () => {
  const { request } = credential.test
  assert.equal(request.baseURL, BASE_URL)
  assert.equal(request.baseURL, nodeDescription.requestDefaults.baseURL)
  assert.equal(request.method, 'GET')
  assert.ok(request.url.startsWith('/') && !request.url.includes('{'), 'a fixed path with no parameter')
  const item = spec.paths[request.url]
  assert.ok(item?.get, `${request.url} is not a GET path in the API description`)
  assert.equal(request.url, '/account')
  assert.deepEqual(specParameters('get', request.url).filter((p) => p.required), [], 'needs no parameter')
  assert.ok(item.get.responses['200'], 'answers 200 for any valid key')
  assert.ok(item.get.responses['401'], 'answers 401 for a bad key, which n8n shows as a failed test')
  const url = new URL(request.baseURL + request.url)
  assert.equal(url.protocol, 'https:')
  assert.equal(url.hostname, spec.servers[0].url.replace(/^https:\/\//, '').split('/')[0])
})

test('the credential test sends no key of its own: n8n adds the Authorization header from authenticate', () => {
  const { request } = credential.test
  assert.equal(request.headers, undefined)
  assert.equal(request.qs, undefined)
  assert.equal(request.body, undefined)
})
