# CivicFlow document intake and vetting

CivicFlow collects applications and documents. Municipal staff review only whether the requested basic fields and pages are present and legible. Passing a basic check does not validate an identity number, establish authenticity, certify legal sufficiency or determine eligibility.

1. Submit the resident application.
2. Open each latest document in Desk → Requirements and confirm its basic checklist, or request a clearer or complete upload with a reason.
3. When all mandatory documents pass, prepare an IndyReach, manual-review or third-party handoff.
4. Download the staff-only ZIP. It contains an immutable application snapshot and the corresponding files. Forward it through the reviewer's authorised channel. Preparing or downloading a bundle does not transmit it to IndyReach.
5. Enter the receiving reviewer's reference and confirm it was actually forwarded.
6. Record the returned outcome and its reason or evidence reference. CivicFlow communicates that result to the resident and preserves the actor, handoff, destination and outcome in its audit records.

Direct IndyReach / third-party integration requires the provider's API contract, credentials, transfer mechanism and returned-outcome authentication. No proprietary IndyReach endpoint has been assumed. The manual handoff and returned-result path are operational; a direct API connection is not configured.

Every application state change creates a retained WhatsApp notification. Meta acceptance, delivery and read confirmation are distinct. Failed or waiting notifications remain available for retry in Desk. A resident can use Main menu → Change language without resetting their application.

For messages outside the WhatsApp reply window, configure an approved utility template in `WHATSAPP_STATUS_TEMPLATE` and its language in `WHATSAPP_STATUS_TEMPLATE_LANGUAGE`. Its body must accept three parameters: full status heading, CivicFlow reference, explanation of the review/decision source. It needs a Main menu quick-reply button at index 0. This is separate from the legacy recommendation template. The temporary Meta test access token must remain valid; integration tests use a mock provider and do not establish real-phone delivery.

Run `node tests/vetting.mjs` for the review gate, archive, returned result, language and retained-notification integration checks, and `npx tsc --noEmit` for type checking.
