# Frontend design coverage

Status: authentication/onboarding implementation in progress; requester/shared, request-flow, and donor boards approved on 2026-10-01 and implementation delegated. Coordinator/admin boards still require image completion/correction and approval.

## Working agreement

- Work on the local branch `Frontend`. Do not push to GitHub or modify `main`.
- Follow `Plan.md` at every stage. Preserve ongoing dependency work.
- Use the supplied aPurple Blood Donation App Design as visual inspiration: https://dribbble.com/shots/24159727-Blood-Donation-App-Design.
- Produce images for every agreed screen before implementation. User approval is required before coding.
- After approval, delegate implementation to `gpt-6.1-sol` with `high` reasoning. The lead coordinates, reviews, and tests.
- Ask about unresolved requirements rather than inventing product behavior.
- Updated user authorization (2026-10-01, verified in collaborating chat): implement frontend, Convex backend, Better Auth, and their integration; provide environment-variable setup. Keep local Frontend and no-push restriction.

## Source completeness

Reviewed `Plan.md` from GitHub commit `cb4a7fe64902fa7fcf4e2f099bb183d107c733fa` on 2026-10-01.
The file has 1,950 lines and ends inside the example in section 14.11, immediately after `Status:`.
Sections 15–21 are listed in the table of contents but have no body. The user authorized designing the existing screens first while the plan is updated, and will explicitly signal when to pull changes. Do not fetch again before that signal. Reconcile later additions when the updated plan is available.

The existing application contains only the starter index screen and root layout. It has no implemented product screens to preserve.

## Screen and surface inventory

Each row is a design coverage item, not a decision to create a separate route. Forms, sheets, detail views, and role variants must be mapped to the confirmed navigation during design. All image, approval, implementation, and verification statuses are pending.

| ID | Screen or surface | Plan.md source | Coverage required |
|---|---|---|---|
| AUTH-01 | Splash | 14.3 | Launch surface |
| AUTH-02 | Welcome | 14.3 | Entry to authentication |
| AUTH-03 | Sign in | 13.5, 14.3 | Email/password |
| AUTH-04 | Sign up | 13.5, 14.3 | Account creation |
| AUTH-05 | Forgot password / reset | 13.5, 14.3 | Password recovery |
| AUTH-06 | Email verification | 14.3 | Verification flow |
| ONB-01 | Select role | 14.4, TS-AUTH-10 | Requester/donor onboarding; no self-assigned staff privileges |
| ONB-02 | Personal details | 14.4, 11.1 | User profile information |
| ONB-03 | Donor details | 14.4, 6.2, 8.2 | Blood group, last donation, preliminary eligibility data |
| ONB-04 | Location | 14.4, 13.9 | Permission explanation and manual fallback |
| ONB-05 | Notification permission | 14.4, 10.3 | Permission explanation and response |
| ONB-06 | Onboarding complete | 14.4 | Completion and entry to role experience |
| HOME-01 | Requester home | 14.5 | Request Blood, active request, nearby/recent requests, statistics, guidance |
| HOME-02 | Donor home | 14.6 | Availability, preliminary eligibility, nearby requests, recent/total donations, blood group |
| REQ-01 | Requests list | 14.2, 13.3, REQ-15, 3.2 | Active/previous requests, search and filters; detailed section 15 missing |
| REQ-02 | Create request: blood and units | 14.7 step 1 | Blood group and units required |
| REQ-03 | Create request: hospital/location | 14.7 step 2 | Hospital selection and location |
| REQ-04 | Create request: urgency/time | 14.7 step 3 | Urgency, required-by time, optional description |
| REQ-05 | Create request: review | 14.7 step 4 | Review and submit |
| REQ-06 | Request tracking | 14.11, 5.3, 6.1, 6.3 | Verification, lifecycle, donor responses, units arranged; detailed section truncated |
| REQ-07 | Request cancellation/completion | REQ-13, REQ-14, FR-REQ-10 | Permitted lifecycle actions |
| DON-01 | Incoming/accepted requests list | DON-09, DON-13, 13.3, 13.17 | Compatible requests and accepted requests |
| DON-02 | Donor request details | 14.9 | Blood group, urgency, hospital, distance, units, time, verification, summary, accept/decline |
| DON-03 | Accepted request coordination | 14.10 | Hospital address, directions, permitted coordinator contact, required time, status |
| DON-04 | Availability | DON-05, DON-06, 6.2 | Available and temporarily unavailable |
| DON-05 | Donation history | DON-14, DON-15, FR-DON-10 | Completed donations and total |
| SHARED-01 | Alerts inbox | 14.2, 10.3 | Read/unread notifications and request links |
| SHARED-02 | Profile and editing | 14.2, 6.2, 11.1, 13.16 | Role-appropriate personal/donor details and sign-out |
| SHARED-03 | Notification preferences | DON-16 | Manage notification preferences |
| COORD-01 | Coordinator dashboard | 13.3, 4.3 | Hospital coordination overview |
| COORD-02 | Pending verification | COORD-02, 13.3 | Pending request queue |
| COORD-03 | Verification and rejection | COORD-03–05 | Review validity and units; verify/reject |
| COORD-04 | Ranked donors and responses | COORD-06–08, 7.1, 10.4 | Compatibility, match scores, approximate distance, response/escalation status |
| COORD-05 | Confirm donation / close request | COORD-09–10, FR-RESP-08 | Confirm units and close fulfilled request |
| COORD-06 | Hospital analytics | COORD-11 | Hospital-related analytics; detailed section 15 missing |
| ADMIN-01 | Administrator dashboard | 13.3, 4.4 | Platform overview |
| ADMIN-02 | Users and roles | ADM-01–04, ADM-09 | Donor/requester/coordinator management and suspension |
| ADMIN-03 | Hospitals and blood banks | ADM-05–06 | Facility management |
| ADMIN-04 | Requests | ADM-07, 13.3 | Request review, verification and rejection |
| ADMIN-05 | Reported requests | ADM-08, 11.8, 13.17 | Reports and resolution |
| ADMIN-06 | Platform analytics | ADM-10, 13.3 | Platform analytics; detailed section 15 missing |
| ADMIN-07 | Audit/activity logs | ADM-11, 11.9 | Sensitive operation history |
| ADMIN-08 | Platform configuration | ADM-12, 7.2 | Configuration, including configurable matching weights; exact settings unspecified |

## Required states across designs

- Form validation, keyboard avoidance, loading, error, empty, refresh, and common mobile viewport behavior (13.2, 13.4, FR-REQ-04).
- Request lifecycle: Pending Verification, Active, Donors Contacted, Partially Fulfilled, Fulfilled, Completed, Cancelled, Expired, Rejected (5.3).
- Donor response states: Notified, Accepted, Declined, NoResponse, Cancelled (11.5).
- Location permission denied with manual city/location fallback (13.9).
- Private donor contact/location before permission; approximate distance only for public donor discovery (9).
- Preliminary eligibility explanation with final medical screening performed by qualified healthcare professionals (8.2).
- AI classification/summary/duplicate-detection surfaces where applicable, with failure not blocking request creation (7.3, 13.13). Exact detailed presentation remains unresolved.

## Confirmed design brief

1. Design the screens covered by the current plan first; wait for the user's signal to pull the updated plan.
2. App display name: Blood Bank.
3. Android/iOS mobile app, following the supplied blood-donation reference. Present workflow groups in one consistent visual direction, with individual mobile screens readable within each board.

## Observed integration discrepancy for later review

Plan.md requires Better Auth. The current package manifest contains `@clerk/expo` and does not contain the prescribed Better Auth packages. No dependency or authentication changes have been made for this design task. Resolve integration ownership before implementation touches authentication.

## Stage checks

1. Reconcile this inventory with the confirmed Plan.md.
2. Generate and review image coverage for every screen/surface in the agreed scope using the supplied visual reference.
3. Record the user's image approvals and revisions.
4. Delegate only approved implementation work to Sol 6.1 at High reasoning.
5. Review frontend changes against Plan.md and approved images; test role flows, UI states, and navigation; run required lint/typecheck after implementation.
6. Keep all work local on Frontend until the user explicitly changes the no-push instruction.
