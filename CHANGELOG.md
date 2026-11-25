# Changelog

## 0.1.8

- README: France joins the countries with monitoring (status change, dissolution when the company is seen closed, BODACC notices as corporate events, sanctions match), on the API's own endpoints; this node itself still offers no monitoring.

## 0.1.7

- Sanctions: **Screen** gains the option Include ICIJ Offshore Leaks Mention: a separate `offshore_leaks` object from the ICIJ Offshore Leaks Database. A mention, never a sanction: static data (the leaks end in 2021), offshore entities and organisation intermediaries only, matched by name only, so a match is a prompt to look and not an identification; ICIJ's disclaimer comes verbatim in `offshore_leaks.notice`; no extra credit.

## 0.1.6

- Company: the Country options add the fifteen LEI layers that went public on 21 and 22 Nov 2026: the Bahamas, Bermuda, the British Virgin Islands, the Cayman Islands, China, Guernsey, Iceland, the Isle of Man, Liechtenstein, Mauritius, Panama, Saudi Arabia, South Africa, Turkey and the United Arab Emirates (entities with an LEI only).
- Company: **Get** embeds officers for the Czech Republic too (Czech natural persons: the name and the month and year of birth only).
- README: the coverage as at 23 Nov 2026 (every live country, and LEI-registered entities in more than 20 other jurisdictions, including Italy, India, Austria, Luxembourg and China).

## 0.1.5

- Company: the Country options gain South Korea, Malta, New Caledonia, Peru, Honduras, Guatemala, Moldova, Uruguay, the Dominican Republic, New Zealand, Bulgaria, Georgia, Tanzania and Zambia, so the list matches the countries the API accepts.
- README: the scope limits name every country the node offers and carry one bullet for each (Argentina, Ukraine, Serbia, Ecuador, Chile, the Netherlands, Mexico, Slovenia, South Korea, Malta, New Caledonia, Greece, Peru, Honduras, Guatemala, Moldova, Uruguay, the Dominican Republic, New Zealand, Bulgaria, Georgia, Tanzania, Zambia and the LEI layers Italy, India, Austria, Luxembourg, Hungary, Portugal and Jersey); the register-change events and monitoring sentences name their countries.
- README: Japan: the VAT number is the T-number while the invoice registration is in force; the employee count, share capital, date of establishment, website and industry division (a JSIC division) only for the companies whose figures gBizINFO (METI) holds.
- Company: the Country options list every country the API serves (fifty-nine in all; twenty-nine before: Argentina, Austria, Chile, Ecuador, Greece, Hungary, India, Italy, Jersey, Luxembourg, Mexico, the Netherlands, Portugal, Serbia and Ukraine were missing).
- Insolvency: Singapore (SG) joins the Country options, which now match the sixteen markets the descriptions list.
- README: Texas, Oregon and Massachusetts in the United States registers; Massachusetts is the Corporations Division's public-record extract of 19 Oct 2026, refreshed only when the Division supplies a newer extract.
- Insolvency: the **Search** operation's description lists all fifteen market codes (it stopped at twelve; Spain, Latvia and Estonia were missing).
- README: Oregon joins the United States registers (active entities only); Colombia is updated monthly, not every working day.

## 0.1.4

- Company: Germany is a registry country (twenty-nine in all): LEI-registered German companies and a partial set of energy-market actors, not an extract of the commercial register, with its scope limits in the README.
- Insolvency: the country comment now says only Austria and the Netherlands lack company records.
- Sanctions Screening: **Entity Type** offers Company, Aircraft and Unknown, the types the API stores; the old Company or Other Entity value is kept as Company (Legacy Value), so saved workflows keep working.

## 0.1.3

- Company: Lithuania, the Czech Republic, Canada, Brazil, Colombia, Australia, Japan, Singapore, Taiwan and Israel are registry countries (twenty-eight in all), with their scope limits in the README.
- Company Autocomplete: **Country** is under **Options**, as on Search and Get (Spain when not set).

## 0.1.2

- Company: Switzerland, Latvia, Cyprus and Romania are registry countries (eighteen in all).

## 0.1.1

- Company: the United States is a registry country (state registers of New York, Colorado, Connecticut and Pennsylvania, SEC filers and LEI holders); a company number is `NY-4424185`, `CIK-0000320193` or `LEI-` and the LEI.
- Company Search: the **Status (Canonical)** filter is now **Status** (the standard status, same list in every country) and there is a new **Local Status** filter for the register's own value.

## 0.1.0

First version.

- Company: Search (with Return All), Autocomplete, Get, Look Up (Batch).
- Sanctions Screening: Screen (beta), with optional PEP screening (beta, Spain only).
- Insolvency: Search (corporate only, nine markets).
- Validation: Validate VAT Number, Look Up LEI.
- Coverage: Get.
- Credential: API key sent as a Bearer token, tested against `GET /account`.
