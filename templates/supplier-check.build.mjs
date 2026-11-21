// Builds templates/supplier-check.json, the n8n workflow template "Check a new supplier": the company's register record,
// an EU check of its VAT number and its corporate insolvency notices, as one report row.
//
//   node templates/supplier-check.build.mjs
//
// The workflow is written here and not by hand, so the JavaScript of its Code node and the text of its notes need no
// JSON escaping, and so every build runs the checks at the end of this file (the report logic on sample answers, the
// connections, n8n's word limits for template notes).
//
// Status: draft. It has not run in a real n8n yet. Before it is submitted: import it, set the credential, run it for a
// company with a VAT number, for one without, for an unknown number and for a country without insolvency coverage, and
// look at the note colours on the canvas (yellow overview, white section notes).
import assert from 'node:assert/strict'
import fs from 'node:fs'

const PROMETIAM = 'n8n-nodes-prometiam.prometiam'
const TESTED_WITH = '0.1.5'
const TRIGGER = 'When clicking ‘Execute workflow’'
const INPUT = 'Supplier to check'
const COMPANY = 'Find the company in the register'
const FOUND = 'Company found?'
const NOT_FOUND = 'Report: company not found'
const HAS_VAT = 'Has a VAT number?'
const VAT = 'Check the VAT number'
const COVERED = 'Insolvency notices covered?'
const INSOLVENCY = 'Search insolvency notices'
const REPORT = 'Build the supplier report'

// The markets of the API's insolvency search (it answers 400 for any other country). Add a market here and in the
// overview note when the API adds one.
const INSOLVENCY_MARKETS = ['FR', 'DE', 'GB', 'AT', 'CH', 'NO', 'FI', 'US', 'NL', 'DK', 'HR', 'SE', 'ES', 'LV', 'EE', 'SG']
const PAGE = 10 // notices asked for, newest first

const overview = `## Check a new supplier: register record, VAT number, insolvency notices

### How it works
For one supplier (a country and a company number) this workflow:
1. finds the company in its official register, or ends with a clear message when no company has that number;
2. checks the VAT number on the record with the EU VAT validation service, when the record has one;
3. searches corporate insolvency notices for the company, when its country is a covered market;
4. returns one report row: name, status, legal form, address, the VAT result, the notices found and the points to review.

The report is a reading aid, not a credit score or a rating. An empty insolvency result only means that no notice was found.

### Setup
1. Install the verified community node \`n8n-nodes-prometiam\` (tested with ${TESTED_WITH}). It runs on n8n Cloud and on self-hosted instances: https://docs.n8n.io/integrations/community-nodes/installation-and-management/install-verified-community-nodes
2. Create a Prometiam API credential with your API key. A key comes with a 14-day free trial of 500 credits (a card is required, nothing is charged during it): https://www.prometiam.com/signup?utm_source=n8n&utm_medium=template
3. Open **${INPUT}** and set \`country\` (ISO code) and \`company_number\`.
4. Run the workflow. One check costs up to 4 credits: search 1, VAT 1, insolvency 2.

Limits: the VAT check covers EU numbers only. Insolvency notices are corporate only and cover sixteen markets (${INSOLVENCY_MARKETS.join(', ')}); for any other country the report says they were not checked.

### Customization
Replace the manual trigger with a form, a webhook or a new row in your supplier sheet, and send the report to Slack, e-mail or your ERP. Add the node's Sanctions Screening operation (beta) if you need it.`

const reportCode = `// One report row from the answers of the nodes before. It is not a score: it lists facts and the points a person should look at.
const company = $('${COMPANY}').first().json;

// The VAT check runs only when the record has a VAT number, and it can fail softly (a member state service that is down).
const vatNode = $('${VAT}');
const vat = vatNode.isExecuted ? vatNode.first().json : null;
const vatAnswered = !!vat && typeof vat.is_valid === 'boolean';

// The insolvency search runs only for a covered market. A check that did not run is reported as not checked, never as "no notices".
const insolvencyNode = $('${INSOLVENCY}');
const insolvencyChecked = insolvencyNode.isExecuted;
const notices = insolvencyChecked ? insolvencyNode.all().map((item) => item.json).filter((n) => n && n.id) : [];
notices.sort((a, b) => String(b.filing_date || '').localeCompare(String(a.filing_date || '')));
const latest = notices[0] || null;
const noticeCount = notices.length + (notices.length >= ${PAGE} ? ' or more' : '');

const review = [];
if (company.status !== 'active') review.push('Register status is "' + (company.status || 'not stated') + '"' + (company.local_status ? ' (' + company.local_status + ')' : ''));
if (!company.vat_number) review.push('No VAT number on the register record: ask the supplier for it');
else if (!vatAnswered) review.push('The VAT number could not be checked (the check covers EU numbers only, and a member state service can be down): try again later');
else if (!vat.is_valid) review.push('The EU check does not confirm the VAT number' + (company.vat_number_source === 'rule' ? ' (it was built from the company identifier: the company may not be registered for intra-EU trade)' : ''));
if (!insolvencyChecked) review.push('Insolvency notices are not covered for ' + company.country + ': not checked');
else if (notices.length) review.push(noticeCount + ' insolvency notice(s); the latest is dated ' + (latest.filing_date || 'unknown') + ' (' + (latest.event_type || 'type not stated') + ')');

return [{
  json: {
    found: true,
    company_name: company.company_name,
    company_number: company.company_number,
    country: company.country,
    status: company.status,
    local_status: company.local_status,
    legal_form: company.legal_form,
    address: [company.address, company.postal_code, company.city].filter(Boolean).join(', '),
    founding_date: company.founding_date,
    vat_number: company.vat_number,
    vat_number_source: company.vat_number_source,
    vat_valid: vatAnswered ? vat.is_valid : null,
    vat_registered_name: vatAnswered ? vat.name : null,
    insolvency_checked: insolvencyChecked,
    insolvency_notices: insolvencyChecked ? notices.length : null,
    latest_notice_date: latest ? latest.filing_date : null,
    latest_notice_type: latest ? latest.event_type : null,
    latest_notice_url: latest ? latest.notice_url : null,
    points_to_review: review,
    checked_at: new Date().toISOString(),
  },
}];`

const id = (n) => `a1000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const note = (n, name, content, x, y, width, height, color) => ({
  parameters: { content, height, width, ...(color ? { color } : {}) },
  id: id(n), name, type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: [x, y],
})
const ifNode = (n, name, x, y, leftValue, type, operation) => ({
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
      conditions: [{ id: id(n + 100), leftValue, rightValue: '', operator: { type, operation, singleValue: true } }],
      combinator: 'and',
    },
    looseTypeValidation: true,
    options: {},
  },
  id: id(n), name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [x, y],
})
const setNode = (n, name, x, y, fields) => ({
  parameters: { assignments: { assignments: fields.map(([field, value, type], i) => ({ id: id(n * 10 + 200 + i), name: field, value, type })) }, options: {} },
  id: id(n), name, type: 'n8n-nodes-base.set', typeVersion: 3.4, position: [x, y],
})
const company = `$('${COMPANY}').first().json`

const nodes = [
  note(1, 'Overview', overview, -760, -300, 660, 900),
  note(2, 'Note: input', '## Input\nOne supplier: its country and its company number. The sample is a large Spanish company.', -40, -300, 440, 480, 7),
  note(3, 'Note: register', '## Register record\nFinds the company by its number. A number no company has ends in a short "not found" report.', 420, -300, 440, 680, 7),
  note(4, 'Note: VAT', '## VAT number\nChecked only when the record has one. If the check does not answer, the report says so and goes on.', 880, -300, 460, 480, 7),
  note(5, 'Note: insolvency', '## Insolvency notices\nCorporate notices, newest first, in the covered markets. For any other country the report says they were not checked.', 1360, -300, 460, 480, 7),
  note(6, 'Note: report', '## Report\nOne row: the facts and the points a person should review. Not a score.', 1840, -300, 300, 480, 7),
  { parameters: {}, id: id(11), name: TRIGGER, type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0] },
  setNode(12, INPUT, 220, 0, [['country', 'ES', 'string'], ['company_number', 'A46103834', 'string']]),
  {
    parameters: { resource: 'company', operation: 'search', returnAll: false, limit: 1, filters: { country: '={{ $json.country }}', companyNumber: '={{ $json.company_number }}' } },
    id: id(13), name: COMPANY, type: PROMETIAM, typeVersion: 1, position: [460, 0], alwaysOutputData: true,
  },
  ifNode(14, FOUND, 680, 0, '={{ $json.id }}', 'number', 'exists'),
  setNode(15, NOT_FOUND, 680, 220, [
    ['found', false, 'boolean'],
    ['message', 'No company with this number in the register of this country. Check the country code and the format of the number.', 'string'],
  ]),
  ifNode(16, HAS_VAT, 920, 0, '={{ $json.vat_number }}', 'string', 'notEmpty'),
  {
    parameters: { resource: 'validation', operation: 'vat', vatNumber: '={{ $json.vat_number }}' },
    id: id(17), name: VAT, type: PROMETIAM, typeVersion: 1, position: [1140, -120], onError: 'continueRegularOutput',
  },
  ifNode(18, COVERED, 1400, 0, `={{ ${JSON.stringify(INSOLVENCY_MARKETS)}.includes(${company}.country) }}`, 'boolean', 'true'),
  {
    parameters: { resource: 'insolvency', operation: 'search', returnAll: false, limit: PAGE, filters: { country: `={{ ${company}.country }}`, companyNumber: `={{ ${company}.company_number }}` } },
    id: id(19), name: INSOLVENCY, type: PROMETIAM, typeVersion: 1, position: [1620, -120], alwaysOutputData: true,
  },
  { parameters: { jsCode: reportCode }, id: id(20), name: REPORT, type: 'n8n-nodes-base.code', typeVersion: 2, position: [1900, 0] },
]

const to = (...names) => names.map((node) => ({ node, type: 'main', index: 0 }))
const connections = {
  [TRIGGER]: { main: [to(INPUT)] },
  [INPUT]: { main: [to(COMPANY)] },
  [COMPANY]: { main: [to(FOUND)] },
  [FOUND]: { main: [to(HAS_VAT), to(NOT_FOUND)] }, // an IF node's outputs: true, then false
  [HAS_VAT]: { main: [to(VAT), to(COVERED)] },
  [VAT]: { main: [to(COVERED)] },
  [COVERED]: { main: [to(INSOLVENCY), to(REPORT)] },
  [INSOLVENCY]: { main: [to(REPORT)] },
}

const workflow = { name: 'Check a new supplier: register record, VAT number and insolvency notices', nodes, connections, active: false, settings: { executionOrder: 'v1' }, pinData: {} }
const text = JSON.stringify(workflow, null, 2) + '\n'

// ---- checks -------------------------------------------------------------------------------------------------------

// 1. Every connection joins two nodes that exist, and no name is used twice.
const names = nodes.map((n) => n.name)
assert.equal(new Set(names).size, names.length, 'a node name is used twice')
for (const [from, v] of Object.entries(connections)) {
  assert.ok(names.includes(from), `unknown source ${from}`)
  for (const branch of v.main) for (const link of branch) assert.ok(names.includes(link.node), `unknown target ${link.node}`)
}

// 2. n8n's rules for template notes: an overview of 100 to 300 words with its three headings, section notes under 50 words.
const words = (s) => s.split(/\s+/).filter(Boolean).length
assert.ok(words(overview) >= 100 && words(overview) <= 300, `the overview note has ${words(overview)} words`)
for (const heading of ['### How it works', '### Setup', '### Customization']) assert.ok(overview.includes(heading), `${heading} is missing`)
for (const n of nodes) if (n.type.endsWith('stickyNote') && n.name !== 'Overview') assert.ok(words(n.parameters.content) < 50, `${n.name} has 50 words or more`)
assert.ok(!text.includes('"credentials"') && !/rk_(?:live|test)_/.test(text), 'a template carries no credential and no key')

// 3. The text follows the package's content rules where its list is present (it is not part of the public repository).
const denyList = new URL('../test/forbidden.mjs', import.meta.url)
if (fs.existsSync(denyList)) {
  const { FORBIDDEN } = await import(denyList.href)
  assert.deepEqual(FORBIDDEN.filter((re) => re.test(text)).map(String), [], 'the template names something the content rules keep out')
}

// 4. The report logic, on the answers the nodes give. `ran` maps a node name to its output items; a node left out did not run.
const report = (ran) => {
  const $ = (name) => ({ isExecuted: name in ran, first: () => ran[name][0], all: () => ran[name] })
  return new Function('$', reportCode)($)[0].json
}
const item = (json) => ({ json })
const active = { id: 1, company_name: 'SAMPLE SA', company_number: 'A00000000', country: 'ES', status: 'active', local_status: 'active', vat_number: 'ESA00000000', vat_number_source: 'rule', address: 'CALLE 1', postal_code: '46000', city: 'VALENCIA' }

let r = report({ [COMPANY]: [item(active)], [VAT]: [item({ is_valid: true, name: null })], [INSOLVENCY]: [item({})] })
assert.deepEqual([r.points_to_review, r.vat_valid, r.insolvency_checked, r.insolvency_notices, r.address], [[], true, true, 0, 'CALLE 1, 46000, VALENCIA'])

// the VAT check failed softly (either shape n8n may give the item) and the country has no insolvency coverage
for (const failed of [{}, { error: 'Service unavailable' }]) {
  r = report({ [COMPANY]: [item({ ...active, country: 'PL' })], [VAT]: [item(failed)] })
  assert.deepEqual([r.vat_valid, r.insolvency_checked, r.insolvency_notices, r.points_to_review.length], [null, false, null, 2])
  assert.match(r.points_to_review[1], /not covered for PL: not checked/)
}

// no VAT number, a closed company and two notices given oldest first
r = report({ [COMPANY]: [item({ ...active, status: 'dissolved', local_status: 'struck off', vat_number: null })], [INSOLVENCY]: [item({ id: 5, filing_date: '2024-03-01', event_type: 'opening' }), item({ id: 6, filing_date: '2025-07-09', event_type: 'closure' })] })
assert.deepEqual([r.vat_valid, r.insolvency_notices, r.latest_notice_date, r.latest_notice_type, r.points_to_review.length], [null, 2, '2025-07-09', 'closure', 3])
assert.match(r.points_to_review[0], /"dissolved" \(struck off\)/)

// the EU check answers "not valid" for a number built by rule, and a full page of notices reads "or more"
r = report({ [COMPANY]: [item(active)], [VAT]: [item({ is_valid: false, name: null })], [INSOLVENCY]: Array.from({ length: PAGE }, (_, i) => item({ id: i + 1, filing_date: '2026-01-0' + (i % 9 + 1) })) })
assert.equal(r.vat_valid, false)
assert.match(r.points_to_review[0], /does not confirm the VAT number \(it was built from the company identifier/)
assert.match(r.points_to_review[1], new RegExp(`^${PAGE} or more insolvency notice`))

fs.writeFileSync(new URL('./supplier-check.json', import.meta.url), text)
console.log(`supplier-check.json written: ${nodes.length} nodes, overview ${words(overview)} words, checks passed`)
