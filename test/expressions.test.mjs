// Every n8n expression in the node, evaluated by n8n's own expression engine (n8n-workflow) on sample input.
// A new or changed expression fails here until it has a row in CASES, so no expression ships untested.
import test from 'node:test'
import assert from 'node:assert/strict'
import { nodeDescription, expressions, Workflow } from './helpers.mjs'

function evaluate(expression, { parameters = {}, keys = {} } = {}) {
  const node = { id: '1', name: 'Prometiam', type: 'n8n-nodes-prometiam.prometiam', typeVersion: 1, position: [0, 0], parameters }
  const props = Object.keys(parameters).map((name) => ({ displayName: name, name, type: 'string', default: '' }))
  const nodeTypes = {
    getByName: () => ({ description: { properties: props } }),
    getByNameAndVersion: () => ({ description: { properties: props, version: 1 } }),
    getKnownTypes: () => ({}),
  }
  const wf = new Workflow({ id: 'w', nodes: [node], connections: {}, active: false, nodeTypes })
  return wf.expression.getParameterValue(expression, null, 0, 0, 'Prometiam', [], 'manual', keys)
}

const page = (cursor, more = true) => ({ body: { pagination: { has_more: more, next_cursor: cursor } } })

/** expression -> [ [input, expected], ... ] */
const CASES = {
  '={{$parameter["operation"] + ": " + $parameter["resource"]}}': [
    [{ parameters: { operation: 'search', resource: 'company' } }, 'search: company'],
  ],
  '=/companies/{{ encodeURIComponent($parameter.companyId) }}': [
    [{ parameters: { companyId: '1234' } }, '/companies/1234'],
    [{ parameters: { companyId: '12 3/4' } }, '/companies/12%203%2F4'],
  ],
  '=/vat/{{ encodeURIComponent($parameter.vatNumber) }}': [
    [{ parameters: { vatNumber: 'DE 811.569.869' } }, '/vat/DE%20811.569.869'],
    [{ parameters: { vatNumber: 'IE6388047V' } }, '/vat/IE6388047V'],
  ],
  '=/lei/{{ encodeURIComponent($parameter.lei) }}': [
    [{ parameters: { lei: 'HWUPKR0MPOU8FGXBT394' } }, '/lei/HWUPKR0MPOU8FGXBT394'],
  ],
  '={{ $value }}': [
    [{ keys: { $value: true } }, true],
    [{ keys: { $value: false } }, false],
  ],
  '={{$value}}': [[{ keys: { $value: 7 } }, 7]],
  '={{ !!$response.body?.pagination?.has_more }}': [
    [{ keys: { $response: page('o:100', true) } }, true],
    [{ keys: { $response: page(null, false) } }, false],
    [{ keys: { $response: {} } }, false],
  ],
  '={{ Object.assign({}, $request.qs, { limit: 100, cursor: $response.body?.pagination?.next_cursor }) }}': [
    // first request: nothing to continue from, the user's filters are kept, limit is raised to 100
    [{ keys: { $request: { qs: { name: 'tele', country: 'ES' } }, $response: {} } }, { name: 'tele', country: 'ES', limit: 100, cursor: undefined }],
    // later requests: the cursor from the previous answer, the filters and the earlier limit are kept
    [{ keys: { $request: { qs: { name: 'tele' } }, $response: page('o:100') } }, { name: 'tele', limit: 100, cursor: 'o:100' }],
  ],
  '={{ $value || undefined }}': [
    [{ keys: { $value: 'tele' } }, 'tele'],
    [{ keys: { $value: '' } }, undefined],
    [{ keys: { $value: 'A46103834' } }, 'A46103834'],
  ],
  '={{ $value ? String($value).substring(0, 10) : undefined }}': [
    [{ keys: { $value: '2026-01-05T00:00:00' } }, '2026-01-05'],
    [{ keys: { $value: '2026-01-05' } }, '2026-01-05'],
    [{ keys: { $value: '' } }, undefined],
  ],
  '={{ $value && $value.length ? $value.join(",") : undefined }}': [
    [{ keys: { $value: ['lei', 'risk_flags'] } }, 'lei,risk_flags'],
    [{ keys: { $value: ['insolvency'] } }, 'insolvency'],
    [{ keys: { $value: [] } }, undefined],
  ],
  '=items[{{$index}}].company_number': [[{ keys: { $index: 0 } }, 'items[0].company_number'], [{ keys: { $index: 12 } }, 'items[12].company_number']],
  '=items[{{$index}}].country': [[{ keys: { $index: 1 } }, 'items[1].country']],
  '=items[{{$index}}].name': [[{ keys: { $index: 2 } }, 'items[2].name']],
  '={{ typeof $value === "string" ? JSON.parse($value) : $value }}': [
    [{ keys: { $value: '[{"country":"ES","company_number":"A1"}]' } }, [{ country: 'ES', company_number: 'A1' }]],
    [{ keys: { $value: [{ country: 'FR', name: 'X' }] } }, [{ country: 'FR', name: 'X' }]],
  ],
  '={{ $value ? "entity" : undefined }}': [
    [{ keys: { $value: true } }, 'entity'],
    [{ keys: { $value: false } }, undefined],
  ],
  '={{ $value ? true : undefined }}': [
    [{ keys: { $value: true } }, true],
    [{ keys: { $value: false } }, undefined],
  ],
}

test('every expression in the node has test cases, and every case is for an expression that is still there', () => {
  const inNode = new Set([...expressions(nodeDescription)].map(([, e]) => e))
  const missing = [...inNode].filter((e) => !(e in CASES))
  const stale = Object.keys(CASES).filter((e) => !inNode.has(e))
  assert.deepEqual(missing, [], 'add a row to CASES for each of these')
  assert.deepEqual(stale, [], 'these rows no longer match any expression')
})

for (const [expression, rows] of Object.entries(CASES)) {
  test(`expression ${expression}`, () => {
    for (const [input, expected] of rows) {
      const actual = evaluate(expression, input)
      assert.deepEqual(actual, expected, JSON.stringify(input))
    }
  })
}
