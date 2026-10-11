# Changelog

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
