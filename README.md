# n8n-nodes-prometiam

This is an n8n community node for [Prometiam](https://www.prometiam.com). It puts company data for Europe and the United States in your workflows: search and look up companies by name or registry number in Spain, France, the United Kingdom, Ireland, Poland, Norway, Finland, Sweden, Belgium, Denmark, Croatia, Estonia, Slovakia, Switzerland, Latvia, Cyprus, Romania and the United States, resolve up to 100 companies in one call, screen names against sanctions lists (beta), check corporate insolvency notices, and validate VAT numbers and LEIs.

[n8n](https://n8n.io) is a workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Working with the results](#working-with-the-results)
- [Rate limits, plans and batching](#rate-limits-plans-and-batching)
- [Scope limits](#scope-limits)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n documentation:

1. Go to **Settings**, then **Community nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-prometiam` in **Enter npm package name**.
4. Agree to the risks of using community nodes and select **Install**.

The node then appears as **Prometiam** in the nodes panel. Only the instance owner or an admin can install community nodes. n8n Cloud lists community nodes only after n8n has verified them; on a self-hosted instance you can install any of them.

To install by hand on a self-hosted instance, run `npm install n8n-nodes-prometiam` in the `nodes` folder of your n8n user folder (`~/.n8n/nodes`) and restart n8n.

## Credentials

1. Start a 14-day free trial at [prometiam.com/signup](https://www.prometiam.com/signup) (card required, nothing charged for 14 days; 1,000 calls, then Starter unless you cancel) to get an API key. It looks like `rk_live_…`. To try the API first without a card, use the demo key in the docs or the MCP server in demo mode (`npx -y prometiam-risk-mcp`, no key). Paid plans are on [prometiam.com/pricing](https://www.prometiam.com/pricing).
2. In n8n, add a **Prometiam API** credential and paste the key into **API key**.
3. Save. n8n tests the credential with one call to `GET /account`, which any valid key can read, and shows whether the key was accepted. That call counts as one request.

The node sends the key as `Authorization: Bearer <key>` to `https://api.prometiam.com/functions/v1/risk-api`. The address is fixed in the node: there is no field to change it, so a workflow cannot send your key to another host.

## Operations

| Resource | Operation | What it does |
| --- | --- | --- |
| Company | Search | Find companies by name or by registry number in one country. Returns one item per company. **Return All** follows the paging cursor for you. |
| Company | Autocomplete | Type-ahead suggestions: give the letters typed so far and a small limit. |
| Company | Get | The full profile of one company by its Company ID, with optional extra blocks (**Include**). |
| Company | Look Up (Batch) | Resolve up to 100 companies in one call. Every item counts as one request. |
| Sanctions Screening | Screen (Beta) | Fuzzy-match a name against consolidated sanctions lists. Optional PEP screening (beta, Spain only). |
| Insolvency | Search | Corporate insolvency notices in twelve markets. |
| Validation | Validate VAT Number | Check an EU VAT number and return the registered trader. |
| Validation | Look Up LEI | Look up a Legal Entity Identifier. |
| Coverage | Get | The countries the API serves and how often each is refreshed. |

### Company

**Search** takes its inputs in **Filters**: Name, Country, Company Number (a Spanish NIF or CIF, French SIREN, UK company number, Irish CRO number, Polish KRS number, Norwegian organisation number, Croatian MBS, Belgian enterprise number or Danish CVR number), VAT Number, SIREN, SIRET, NIP, REGON, OIB, Status, Local Status, Founded After and Founded Before. Give at least one of Name or an identifier. A name matches partially, best match first, and each company carries a `match_score` from 0 to 100. If you leave Country out, the API uses the first country allowed for your key (usually Spain). With **Return All** off, **Limit** caps the number of items (1 to 100).

**Autocomplete** is the same search with the fields a type-ahead needs: **Text**, **Country** and **Limit** (default 6). The API has no separate autocomplete endpoint, so this operation calls `GET /companies/search`.

**Get** takes the **Company ID** (the `id` of a search result). Under **Options**, **Include** attaches the risk flags (registry-compliance signal), corporate insolvency notices, the LEI record or public procurement awards to the profile. Officers are embedded where they exist, in Spain, France, the United Kingdom and Norway only.

**Look Up (Batch)** takes companies either as rows (**Define Below**: country plus a company number, or country plus a name) or as a JSON array (**JSON**, for example the output of a previous node). It returns one item per input row with a `status` of `found`, `not_found`, `error` or `timeout` (resend timeouts). **Every item counts as one request** against your plan. A batch larger than your remaining quota is refused up front with `429 batch_exceeds_quota` and the number that fits in `max_items_now`. Batch calls are not part of the free trial. **Options** has an **Idempotency Key** to replay the same batch safely for 24 hours without using quota again.

### Sanctions Screening (beta)

Sanctions screening is **beta** and its results are limited: do not use it as your only sanctions control. **Screen** takes a **Name** and, under **Options**, a **Minimum Match Score** (50 to 100, default 80), an **Entity Type**, a **Limit** and **Group by Entity**. **Include PEP Screening** is **beta and Spain only**, and it is not a complete PEP check: the list holds no relatives or close associates. Sanctions screening needs a plan that includes it; the API answers `403` otherwise.

By default the node returns one item with the matches under `data` and a summary under `meta`, so you can branch on `{{ $json.meta.result_count }}` even when nothing matches. Turn on **Split Matches Into Items** to get one item per match.

### Insolvency

**Search** covers corporate insolvency notices only (personal and consumer insolvency is never returned) in twelve markets: FR, DE, GB, AT, CH, NO, FI, US, NL, DK, HR and SE. Spain's insolvency data is not part of this operation. Give at least one of Company Name, Company Number, Country, Event Type or Date From under **Filters**. No notice found is not proof of solvency.

### Validation

**Validate VAT Number** covers the EU member states plus Northern Ireland (`XI`); Greek numbers use the `EL` prefix and GB VAT numbers are out of scope. If a member state's service is down the operation fails with `503` (retryable) instead of reporting the number as invalid. **Look Up LEI** takes a 20-character LEI. Each call counts as one request.

## Working with the results

- Searches and batches return **one item per record**. When nothing matches, the operation returns **no items** and the branch stops; turn on **Always Output Data** in the node's settings if you want one empty item to continue with.
- **Get**, **Validate VAT Number**, **Look Up LEI** and **Get Coverage** return one item.
- Blocks that vary, such as the `include` blocks of **Get** and the `pep` block of a screening, are returned as extra fields of the item.
- An error from the API stops the node with the API's message, for example `Authorization failed - please check your credentials` for a rejected key. Turn on **Continue On Fail** to handle errors in the workflow.
- Every input item makes its own API call, all at once. See the next section before you feed a long list into the node.

## Rate limits, plans and batching

The free plan allows 10 requests a minute; paid plans allow more (see the [pricing page](https://www.prometiam.com/pricing)). Over the limit the API answers `429` with a `Retry-After` header. A node with many input items sends one request per item at the same moment, which a low limit will refuse. Under **Options**, add **Batching** to space the requests out: **Items per Batch** and **Batch Interval (Ms)** (the defaults send 10 items every 60 seconds, which fits the free plan). To resolve a long list of companies, the **Look Up (Batch)** operation needs far fewer calls, but every item in it still counts as one request.

**Options** also has a **Timeout** for a single request. Monthly quotas count successful requests only.

## Scope limits

- Company records are live for Spain, France, the United Kingdom, Ireland, Poland, Norway, Finland, Sweden, Belgium, Denmark, Croatia, Estonia, Slovakia, Switzerland, Latvia, Cyprus, Romania and the United States. Officers exist for Spain, France, the United Kingdom and Norway only. This node does not offer corporate events or monitoring (the API does, on its own endpoints); officers are embedded in **Get** where they exist. Ireland and Poland are company-level (no officers yet).
- Estonia is company records only (no officers, no registry-compliance signal); status includes liquidation and bankruptcy (no insolvency notices); activity codes in EMTAK 2008 or 2025 per company; sole traders (FIE) are never served.
- Slovakia is company records only (no officers, no registry-compliance signal); commercial legal persons only; status includes bankruptcy (konkurz) and restructuring (no insolvency notices); no VAT number; sole traders and other natural persons are never served.
- Switzerland is company records only (no officers, no registry-compliance signal, no activity code); legal entities and branches on the commercial register only, sole proprietorships are never served; status includes liquidation and dissolved for a deleted company; insolvency notices (SHAB) are linked by UID where the notice names it.
- Latvia is company records only, updated daily; status includes liquidation, insolvency and restructuring (no insolvency notices); no activity code; sole traders, farms and cooperatives are never served.
- Cyprus is company records only, updated monthly; no activity code, share capital or VAT number; names as filed, in Greek or Latin letters; partnerships and business names are never served.
- Romania is company records only, updated monthly; status includes dissolution, liquidation and insolvency (no insolvency notices); no share capital; the VAT number is built from the CUI and not confirmed by the register; sole traders (PFA, II, IF) are never served.
- Finland is company records only (with register-change events and monitoring, but no officers and no registry-compliance signal); its insolvency notices are linked by business ID.
- Sweden is company records only (with register-change events and monitoring, but no officers and no registry-compliance signal; corporate insolvency notices are linked by organisationsnummer), and sole traders are never served.
- Croatia is company records only (with register-change events and monitoring, but no officers and no registry-compliance signal; corporate insolvency notices are linked by MBS), and sole traders are never served.
- Belgium is company records only (with register-change events and monitoring, but no officers, no registry-compliance signal and no insolvency notices: a bankruptcy shows in the company status and in the register-change events), and enterprises of natural persons are never served. Belgium is not one of the twelve insolvency markets.
- Denmark is company records only (with register-change events and monitoring, but no officers, no registry-compliance signal and no share capital; corporate insolvency notices are linked by CVR number), and sole proprietorships and estates are never served. Its status includes the register's bankruptcy state.
- The United States is company records only (no officers and no registry-compliance signal, with register-change events (dated by the weekly read) and monitoring): the business registers of New York, Colorado, Connecticut and Pennsylvania plus SEC filers and LEI holders from every state, Delaware included; not every US company. One record per state registration; New York and Pennsylvania publish active entities only; updated weekly. A company number is `NY-4424185`, `CIK-0000320193` or `LEI-` and the LEI; there is no US VAT number.
- Register-change events (name, status, legal form and registered address; share capital for Croatia) are dated when the change first appears in the register data (for the United States, the weekly read of the registers that first sees it), are not gazette notices and start on 2026-09-30.
- Insolvency notices are corporate only, in twelve markets (FR, DE, GB, AT, CH, NO, FI, US, NL, DK, HR, SE).
- Sanctions screening is beta. PEP screening is beta and Spain only.

## Compatibility

Built and tested against n8n 2.41 (self-hosted, Node 24). Earlier n8n versions have not been tested. The package has no runtime dependencies.

## Resources

- [Prometiam API documentation](https://www.prometiam.com/risk-api/docs)
- [Start a 14-day free trial](https://www.prometiam.com/signup)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: [support@prometiam.com](mailto:support@prometiam.com)

## License

[MIT](LICENSE.md)
