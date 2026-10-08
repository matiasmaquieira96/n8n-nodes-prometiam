// The node description: resources, operations, and that every request it builds points at something the API has.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  nodeDescription, BASE_URL, spec, SPEC_SKIP, walkProperties, operationOptions, specParameters, specProperties, specRef,
  parseUrl, findSpecPath, visibleStrings, forbiddenIn, FORBIDDEN_SKIP,
} from './helpers.mjs'

const EXPECTED = {
  company: ['autocomplete', 'get', 'lookup', 'search'],
  coverage: ['get'],
  insolvency: ['search'],
  sanctions: ['screen'],
  validation: ['lei', 'vat'],
}

test('the node is declarative-style, usable as an AI tool, with one required credential', () => {
  assert.equal(nodeDescription.name, 'prometiam')
  assert.equal(nodeDescription.displayName, 'Prometiam')
  assert.equal(nodeDescription.version, 1)
  assert.equal(nodeDescription.usableAsTool, true)
  assert.deepEqual(nodeDescription.credentials, [{ name: 'prometiamApi', required: true }])
  assert.equal(nodeDescription.requestDefaults.baseURL, BASE_URL)
  assert.equal(nodeDescription.requestDefaults.headers.Accept, 'application/json')
})

test('no property lets a workflow change the API host', () => {
  const names = [...walkProperties()].map(({ prop }) => prop.name.toLowerCase())
  for (const bad of ['baseurl', 'url', 'host', 'endpoint', 'server']) assert.ok(!names.includes(bad), bad)
  assert.match(BASE_URL, /^https:\/\/api\.prometiam\.com\/functions\/v1\/risk-api$/)
})

test('resources and operations are exactly the ones asked for', () => {
  const resources = nodeDescription.properties.find((p) => p.name === 'resource')
  assert.deepEqual(resources.options.map((o) => o.value).sort(), Object.keys(EXPECTED))
  const actual = {}
  for (const { resource, value } of operationOptions()) (actual[resource] ||= []).push(value)
  for (const list of Object.values(actual)) list.sort()
  assert.deepEqual(actual, EXPECTED)
})

test('every operation is shown only for its resource and builds a request itself', () => {
  for (const { resource, value, option } of operationOptions()) {
    const where = `${resource}.${value}`
    assert.ok(option.routing?.request?.method, `${where}: method`)
    assert.ok(option.routing.request.url, `${where}: url`)
    assert.ok(option.action && option.description, `${where}: action and description`)
  }
})

test('every property that is shown belongs to a resource and operation that exist', () => {
  for (const { prop, path, resource, operations } of walkProperties()) {
    if (prop.name === 'resource' || path.startsWith('requestOptions')) continue
    assert.ok(resource, `${path}: no resource in displayOptions`)
    assert.ok(EXPECTED[resource], `${path}: unknown resource ${resource}`)
    for (const op of operations ?? []) assert.ok(EXPECTED[resource].includes(op), `${path}: ${resource} has no operation ${op}`)
  }
})

test('the sanctions operation is marked beta wherever it is described', () => {
  const op = operationOptions().find((o) => o.resource === 'sanctions')
  assert.match(op.option.name, /\(Beta\)/)
  assert.match(op.option.description, /^Beta\./)
  assert.match(op.option.description, /only sanctions control/)
  const pep = [...walkProperties()].find(({ prop }) => prop.name === 'includePep').prop
  assert.match(pep.displayName, /Beta, Spain Only/)
  assert.match(pep.description, /Beta and Spain only/)
  assert.match(pep.description, /relatives or close associates/)
})

test('scope limits travel with the features they limit', () => {
  const byName = (n) => [...walkProperties()].find(({ prop }) => prop.name === n).prop
  const insolvency = operationOptions().find((o) => o.resource === 'insolvency').option.description
  assert.match(insolvency, /corporate only/i)
  assert.match(insolvency, /twelve markets/)
  for (const cc of ['FR', 'DE', 'GB', 'AT', 'CH', 'NO', 'FI', 'US', 'NL', 'DK', 'HR', 'SE']) assert.match(insolvency, new RegExp(`\\b${cc}\\b`), cc)
  const lookup = byName('inputMode').description
  assert.match(lookup, /Every item counts as one request/)
  assert.match(lookup, /up to 100/)
  assert.match(lookup, /free trial/)
  assert.match(byName('companyId').description, /Spain, France, the United Kingdom and Norway only/)
  assert.match(nodeDescription.description, /sanctions lists \(beta\)/)
})

test('the thirteen registry countries and twelve insolvency markets are offered', () => {
  const all = [...walkProperties()]
  const registry = all.find(({ path, resource }) => path === 'filters.country' && resource === 'company').prop
  assert.deepEqual(registry.options.map((o) => o.value).sort(), ['BE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'HR', 'IE', 'NO', 'PL', 'SE', 'SK'])
  const insolvency = all.find(({ path, resource }) => path === 'filters.country' && resource === 'insolvency').prop
  assert.deepEqual(insolvency.options.map((o) => o.value).sort(), ['AT', 'CH', 'DE', 'DK', 'FI', 'FR', 'GB', 'HR', 'NL', 'NO', 'SE', 'US'])
})

test('options are sorted by name, as n8n lint asks', () => {
  for (const { prop, path } of walkProperties()) {
    if (!['options', 'multiOptions'].includes(prop.type) || prop.options.length < 3) continue
    const names = prop.options.map((o) => o.name)
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en')), path)
  }
})

test('customer-visible text names no data source, pipeline internal or record count', { skip: FORBIDDEN_SKIP }, () => {
  const bad = []
  for (const [where, text] of visibleStrings(nodeDescription)) for (const re of forbiddenIn(text)) bad.push(`${where}: ${re}`)
  assert.deepEqual(bad, [])
})

// ── agreement with the API description ──────────────────────────────────────────────────────────

/** For one operation: every routing declaration that puts something on the request. */
function requestParts(resource, operation) {
  const parts = { query: new Set(), body: new Set(), headers: new Set(), params: new Set() }
  const opOption = operationOptions().find((o) => o.resource === resource && o.value === operation)
  const { template, params } = parseUrl(opOption.option.routing.request.url)
  params.forEach((p) => parts.params.add(p))
  for (const { prop, resource: r, operations } of walkProperties()) {
    if (r !== resource || (operations && !operations.includes(operation))) continue
    const send = prop.routing?.send
    const req = prop.routing?.request
    if (send?.property) {
      if (send.type === 'body') parts.body.add(send.property)
      else parts.query.add(send.property)
    }
    for (const k of Object.keys(req?.qs ?? {})) parts.query.add(k)
    for (const k of Object.keys(req?.headers ?? {})) parts.headers.add(k)
    const generic = prop.routing?.operations?.pagination
    if (generic) parts.paging = generic.properties
  }
  return { ...parts, template, method: opOption.option.routing.request.method }
}

test('every operation calls a method and path that exist in the API description', { skip: SPEC_SKIP }, () => {
  for (const { resource, value } of operationOptions()) {
    const { template, method } = requestParts(resource, value)
    const specPath = findSpecPath(template)
    assert.ok(specPath, `${resource}.${value}: ${method} ${template} is not a path in the API description`)
    assert.ok(spec.paths[specPath][method.toLowerCase()], `${resource}.${value}: ${specPath} has no ${method}`)
  }
})

test('URL parameters are node parameters that exist, are required, and name the spec\'s path parameter', { skip: SPEC_SKIP }, () => {
  const expectedPathParam = { companyId: 'id', vatNumber: 'vatNumber', lei: 'lei' }
  for (const { resource, value } of operationOptions()) {
    const { params, template, method } = requestParts(resource, value)
    const specPath = findSpecPath(template)
    const inPath = specParameters(method.toLowerCase(), specPath).filter((p) => p.in === 'path').map((p) => p.name)
    assert.equal(params.size, inPath.length, `${resource}.${value}: path parameters`)
    for (const name of params) {
      const owner = [...walkProperties()].find(({ prop, resource: r, operations }) => prop.name === name && r === resource && operations?.includes(value))
      assert.ok(owner, `${resource}.${value}: $parameter.${name} is not a property of the operation`)
      assert.equal(owner.prop.required, true, `${name} is required`)
      assert.ok(inPath.includes(expectedPathParam[name]), `${name} should fill {${expectedPathParam[name]}}`)
    }
  }
})

test('every query parameter, body field and header the node sends exists on that operation in the API', { skip: SPEC_SKIP }, () => {
  for (const { resource, value } of operationOptions()) {
    const { query, body, headers, template, method, paging } = requestParts(resource, value)
    const specPath = findSpecPath(template)
    const specParams = specParameters(method.toLowerCase(), specPath)
    const named = (loc) => new Set(specParams.filter((p) => p.in === loc).map((p) => p.name))
    for (const q of query) assert.ok(named('query').has(q), `${resource}.${value}: query "${q}" is not a parameter of ${method} ${specPath}`)
    for (const h of headers) assert.ok(named('header').has(h), `${resource}.${value}: header "${h}" is not a parameter of ${specPath}`)
    if (paging) {
      // paging sends limit and cursor, both real query parameters of the operation
      assert.ok(named('query').has('limit') && named('query').has('cursor'), `${specPath} has no limit and cursor to page with`)
    }
    if (body.size) {
      const schema = spec.paths[specPath][method.toLowerCase()].requestBody.content['application/json'].schema
      const top = specProperties(schema)
      const itemProps = specProperties(schema.properties.items.items)
      for (const b of body) {
        const m = /^(\w+)(?:\[\{\{\$index\}\}\]\.(\w+))?$/.exec(b.replace(/^=/, ''))
        assert.ok(m, `${resource}.${value}: unexpected body property ${b}`)
        assert.ok(top.has(m[1]), `${resource}.${value}: body field ${m[1]}`)
        if (m[2]) assert.ok(itemProps.has(m[2]), `${resource}.${value}: item field ${m[2]}`)
      }
    }
  }
})

test('every required parameter of the API operation is sent by the node', { skip: SPEC_SKIP }, () => {
  for (const { resource, value } of operationOptions()) {
    const { query, params, template, method } = requestParts(resource, value)
    const specPath = findSpecPath(template)
    const required = specParameters(method.toLowerCase(), specPath).filter((p) => p.required)
    for (const p of required) {
      if (p.in === 'path') assert.ok(params.size >= 1, `${resource}.${value}: path parameter ${p.name}`)
      else if (p.in === 'query') assert.ok(query.has(p.name), `${resource}.${value}: required query ${p.name} is not sent`)
    }
  }
})

test('option values are values the API accepts', { skip: SPEC_SKIP }, () => {
  const all = [...walkProperties()]
  const sends = (prop) => prop.routing?.send?.property
  const specEnum = (resource, operation, query) => {
    const { template, method } = requestParts(resource, operation)
    const p = specParameters(method.toLowerCase(), findSpecPath(template)).find((x) => x.name === query)
    return p?.schema?.enum
  }
  let checked = 0
  for (const { prop, resource, operations } of all) {
    if (prop.type !== 'options' || !sends(prop) || !operations) continue
    const allowed = specEnum(resource, operations[0], sends(prop))
    if (!allowed) continue
    checked++
    const values = prop.options.map((o) => o.value)
    assert.deepEqual(values.filter((v) => !allowed.includes(v)), [], `${resource}.${operations[0]} ${prop.name}`)
    // a list the API defines must be offered in full
    if (['country', 'status', 'entity_type', 'pep_min_tier'].includes(sends(prop))) {
      assert.deepEqual([...values].sort(), [...allowed].sort(), `${resource}.${operations[0]} ${prop.name} is incomplete`)
    }
  }
  assert.ok(checked >= 7, `only ${checked} option lists were compared`)
  // include: the values the description names
  const include = all.find(({ prop }) => prop.name === 'include').prop
  const specInclude = specParameters('get', '/companies/{id}').find((p) => p.name === 'include')
  for (const o of include.options) assert.ok(specInclude.description.includes(o.value), `include=${o.value}`)
})

test('limits and defaults match the API description', { skip: SPEC_SKIP }, () => {
  const limit = specRef('#/components/parameters/Limit').schema
  const threshold = spec.paths['/sanctions/screen'].get.parameters.find((p) => p.name === 'threshold').schema
  let seen = 0
  for (const { prop, path } of walkProperties()) {
    if (prop.routing?.send?.property === 'limit') {
      seen++
      assert.equal(prop.typeOptions.minValue, limit.minimum, path)
      assert.equal(prop.typeOptions.maxValue, limit.maximum, path)
    }
    if (prop.routing?.send?.property === 'threshold') {
      assert.equal(prop.typeOptions.minValue, threshold.minimum)
      assert.equal(prop.typeOptions.maxValue, threshold.maximum)
      assert.equal(prop.default, threshold.default)
    }
  }
  assert.equal(seen, 4, 'company search, autocomplete, insolvency search and the sanctions option')
})

test('Options carries n8n\'s batching and timeout, so one input item per request can be spaced out', () => {
  const opts = nodeDescription.properties.find((p) => p.name === 'requestOptions')
  assert.equal(opts.type, 'collection')
  assert.equal(opts.displayOptions, undefined, 'shown for every resource and operation')
  assert.deepEqual(opts.options.map((o) => o.name), ['batching', 'timeout'])
  const batch = opts.options[0].options[0]
  assert.equal(batch.name, 'batch')
  assert.deepEqual(batch.values.map((v) => v.name), ['batchSize', 'batchInterval'])
  // there is no way to switch off certificate checks or to change the host: the node sends an API key
  const names = JSON.stringify(opts).toLowerCase()
  assert.ok(!names.includes('allowunauthorizedcerts') && !names.includes('ssl') && !names.includes('proxy'))
})

test('paging: Return All follows the cursor with the largest page the API gives', () => {
  const pagers = [...walkProperties()].filter(({ prop }) => prop.name === 'returnAll')
  assert.equal(pagers.length, 2)
  for (const { prop } of pagers) {
    const p = prop.routing.operations.pagination
    assert.equal(p.type, 'generic')
    assert.match(p.properties.continue, /pagination\?\.has_more/)
    assert.match(p.properties.request.qs, /cursor: \$response\.body\?\.pagination\?\.next_cursor/)
    assert.match(p.properties.request.qs, /limit: 100/)
    assert.match(p.properties.request.qs, /\$request\.qs/, 'the filters must survive into the next page')
  }
})

test('results come back as one item per record, except the sanctions screen which keeps data and meta together', () => {
  for (const { resource, value, option } of operationOptions()) {
    const rooted = option.routing.output?.postReceive?.some((a) => a.type === 'rootProperty' && a.properties.property === 'data')
    assert.equal(Boolean(rooted), resource !== 'sanctions', `${resource}.${value}`)
  }
  const split = [...walkProperties()].find(({ prop }) => prop.name === 'splitMatches').prop
  assert.equal(split.default, false)
  assert.equal(split.routing.output.postReceive[0].enabled, '={{ $value }}')
})
