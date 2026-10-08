# CivicFlow — Khula

CivicFlow is a municipal intake pilot with two connected experiences:

- a resident-facing Khula WhatsApp conversation that collects registration details, household and income information, consent, and supporting documents;
- a CivicFlow Desk for authorised staff to review cases, documents, tasks, and the audit trail without making automated final decisions.

Residents use the WhatsApp Cloud API webhook at `/api/whatsapp`. The website opens on CivicFlow Desk. The in-app conversation is a staff-only testing tool, not a resident submission channel. WhatsApp files are downloaded and saved in R2, with D1 records linking them to the case and requirement.

## Pilot scope

This build implements the first New Application vertical slice described in the RITA/CivicFlow manuals. It includes resumable cases, dynamic document requirements, immutable submission snapshots, status checks, change and appeal task creation, secure R2 document storage, D1 case records, and staff review.

Rates-rebate calculations and production eligibility decisions remain disabled until Govan Mbeki Local Municipality confirms the policy values, formulas, delegation rules, and legal controls identified in Manual 38.

## WhatsApp setup

Copy the keys from `.env.example` into the Site's managed runtime configuration using values from the municipality-owned Meta Business account. Configure the Meta webhook callback as:

`https://<public-site-host>/api/whatsapp`

The webhook is publicly reachable and verifies Meta signatures. Staff pages and staff APIs require an authenticated account on the server-side staff allowlist. Never place service credentials in callback URLs, browser code or the repository.

`WHATSAPP_BUSINESS_NUMBER` is the public number in international format used for a WhatsApp test link; it is different from Meta's `WHATSAPP_PHONE_NUMBER_ID`. `STAFF_USER_EMAILS` is a comma-separated server-side allowlist. Production staff pages, case APIs, document viewing, staff test chat and staff test uploads require an authenticated, allowlisted account. A Site viewer does not automatically become staff. The signed WhatsApp webhook is the only external resident intake path. Configure `ENVIRONMENT=production` in the hosted runtime; development bypass is for local testing only.

The connection screen reports configuration, not delivery health. Before onboarding residents, verify Meta's callback, subscribe to message events and test a complete conversation plus PDF/photo intake. The current pilot does not implement proactive WhatsApp template notifications.

## Development

Requires Node.js 22.13 or later.

```bash
npm install
npm run build
```

Generate a new migration after schema changes with `npm run db:generate`. Never put live WhatsApp credentials in source control.


## Bulk exports

CivicFlow Desk offers case-summary, household and income CSV exports and full case JSON exports. Export all or the current search results. The API streams every matching record in pages of 100, independently of the case-list display limit. Staff authentication is required and each export request is audited. Identity references remain masked; document metadata is included, not file bytes or storage keys. CSV fields neutralise spreadsheet formulas.

## Recommendation notifications

Staff assessment actions create a persistent WhatsApp notification beginning `Recommendation: ...`. Recommended approval and decline explicitly remain subject to a final decision by an authorised official. Meta acceptance is shown separately from delivered/read status. Delivery errors are visible and staff can retry; queued notifications are retried when the resident next messages Khula. Notifications with no linked WhatsApp session cannot be sent.

Within WhatsApp's customer-service reply window, updates use the resident's selected language and include a Main menu button. Beyond the window, configure an approved utility template using `WHATSAPP_RECOMMENDATION_TEMPLATE` and `WHATSAPP_RECOMMENDATION_TEMPLATE_LANGUAGE` (default `en_US`). The approved template must contain this body and a single quick-reply button labelled `Main menu`:

```
Recommendation: {{1}}
Reference: {{2}}
{{3}}
```

The three parameters are the status, case reference and the explanation distinguishing a recommendation from a final decision. Button index 0 uses payload `MENU_HOME`. Only set the template name after Meta approves the exact structure. The current free test configuration has no approved custom template, so closed-window updates wait for a resident reply. An expired access token must be refreshed in managed Site secrets; credentials never belong in GitHub. Do not interpret API acceptance as delivery confirmation.

Every WhatsApp conversation reply offers Main menu. Continue my application restores the previous application step without deleting collected information.
