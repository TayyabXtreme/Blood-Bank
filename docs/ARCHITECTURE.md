# Architecture

Screens use a typed application context. Demo mode provides fictional in-memory data and simulated commands; live mode provides authenticated Convex subscriptions and mutations. Demo does not create a Convex client. Live mode never substitutes demo data for service failures.

| Backend module                                             | Responsibility                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `schema.ts`, `validators.ts`                               | Indexed database model and runtime validators                        |
| `auth.ts`, `auth.config.ts`, `convex.config.ts`, `http.ts` | Better Auth component, Expo/cross-domain plugins, HTTP routes        |
| `lib/permissions.ts`                                       | Identity, active-account, ownership and hospital-scope authorization |
| `users.ts`, `donors.ts`, `hospitals.ts`                    | Profiles, roles, private location and facility management            |
| `requests.ts`, `responses.ts`                              | Validated request lifecycle and transactional donation confirmation  |
| `matching.ts`                                              | Compatibility, eligibility, distance, ranking and scheduled batches  |
| `notifications.ts`                                         | Inbox, devices, delivery tickets and receipts                        |
| `ai.ts`                                                    | Optional redacted AI summary and suggested urgency                   |
| `reports.ts`, `settings.ts`, `setup.ts`                    | Moderation, policy and owner-only bootstrap                          |
| `app.ts`, `crons.ts`                                       | Sanitized role-aware subscriptions and expiry safety net             |

## Invariants

- Requests start pending. Verification precedes matching.
- Acceptance is a commitment, not a donation or arranged unit.
- Coordinator confirmation records one unit, creates a donation record, and updates donor cooldown in one transaction.
- Repeated confirmation is rejected. Only fulfilled requests can be completed.
- Closed/expired/cancelled/rejected requests stop matching; unconfirmed open offers are cancelled.
- Donors cannot accept another open commitment. Server acceptance rechecks current eligibility and remaining demand.
- Coordinators only manage assigned-hospital requests. Public signup cannot grant privileged roles.

## Matching

Filter active donor accounts by availability, screening declaration, configured age/cooldown, temporary pause, notification preference, blood compatibility, and existing commitment. Calculate Haversine distance from rounded private coordinates to the hospital; rank by normalized distance/readiness/reliability/availability/urgency weights. Notify the top configured batch, record score/distance, and schedule the next stage with a bounded expanding radius.

`nextEscalationAt` prevents duplicate calls from creating simultaneous batches. Later stages close unanswered old offers. Accepted commitments plus confirmed units stop additional outreach; critical requests wait half the normal interval. Matching remains deterministic and independent of AI.

## Privacy

Mobile guards improve navigation; server checks enforce authorization. Internal matching/AI/push/bootstrap functions are unavailable to clients. The snapshot exposes a donor profile only to its owner, names to the requester/care team only after acceptance, and phone numbers only with consent. Free-text private notes never enter push payloads or AI prompts. Server secrets stay on Convex.

## Tests and scale

Tests enumerate compatibility and eligibility boundaries, verify geographic scoring, and exercise lifecycle/privacy invariants. Backend tests execute actual Convex functions through `convex-test`; only external identity lookup is mocked.

The bounded dashboard snapshot is an MVP aggregation point. Larger deployments should use indexed paginated feeds, aggregate counters, and geographic donor partitions. Current analytics describe the loaded recent window.
