# CivicFlow — Khula

CivicFlow is a municipal intake pilot with two connected experiences:

- a resident-facing Khula WhatsApp conversation that collects registration details, household and income information, consent, and supporting documents;
- a CivicFlow Desk for authorised staff to review cases, documents, tasks, and the audit trail without making automated final decisions.

Residents use the WhatsApp Cloud API webhook at `/api/whatsapp`. The website opens on CivicFlow Desk. The in-app conversation is a staff-only testing tool, not a resident submission channel. WhatsApp files are downloaded and saved in R2, with D1 records linking them to the case and requirement.

## Pilot scope

This build implements the first New Application vertical slice described in the RITA/CivicFlow manuals. It includes resumable cases, dynamic document requirements, immutable submission snapshots, status checks, change and appeal task creation, secure R2 document storage, D1 case records, and staff review.

Rates-rebate calculations and production eligibility decisions remain disabled until Greater Makhanda Municipality confirms the policy values, formulas, delegation rules, and legal controls identified in Manual 38.

## WhatsApp setup

Copy the keys from `.env.example` into the Site's managed runtime configuration using values from the municipality-owned Meta Business account. Configure the Meta webhook callback as:

`https://<public-site-host>/api/whatsapp`

The current private pilot is intended for internal review. Meta cannot deliver webhook traffic through ChatGPT sign-in. Before launch, configure an externally reachable webhook gateway that forwards the original signed request to the private Site using its service credential, or explicitly authorise a public Site audience with staff routes protected. Do not put the Site service credential in a browser, callback URL or source code. Keep the Site private until the delivery path has been agreed and verified.

`WHATSAPP_BUSINESS_NUMBER` is the public number in international format used for a WhatsApp test link; it is different from Meta's `WHATSAPP_PHONE_NUMBER_ID`. `STAFF_USER_EMAILS` is a comma-separated server-side allowlist. Production staff pages, case APIs, document viewing, staff test chat and staff test uploads require an authenticated, allowlisted account. A Site viewer does not automatically become staff. The signed WhatsApp webhook is the only external resident intake path. Configure `ENVIRONMENT=production` in the hosted runtime; development bypass is for local testing only.

The connection screen reports configuration, not delivery health. Before onboarding residents, verify Meta's callback, subscribe to message events and test a complete conversation plus PDF/photo intake. The current pilot does not implement proactive WhatsApp template notifications.

## Development

Requires Node.js 22.13 or later.

```bash
npm install
npm run build
```

Generate a new migration after schema changes with `npm run db:generate`. Never put live WhatsApp credentials in source control.
