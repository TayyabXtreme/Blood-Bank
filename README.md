# BloodBank

A mobile-first blood donation coordination MVP based on [Plan.md](./Plan.md), built with Expo SDK 57, React Native, Expo Router, NativeWind, Better Auth, and Convex.

## Run the interactive demo

```powershell
npm ci
npm start
```

Use `npm run web` for a browser preview. Without an explicit live-mode setting, the app uses fictional sample data. Choose donor, requester, coordinator, or administrator on the welcome screen. Switch roles from Profile without losing the current demo session to try creation → verification → acceptance → confirmation → completion.

Demo state is in memory and resets on restart. Demo authentication is a labeled simulation; passwords are never stored, authenticated, or transmitted. Reset sample data from Profile to start again. Demo commands never mutate the live Convex database.

## Included

- Email/password signup/signin, native secure sessions, password reset, optional email verification, and sign-out.
- Four-step onboarding with blood group, age, preliminary screening declaration, last donation, approximate GPS, and manual city fallback.
- Four-step request creation, hospital verification, urgency, deadline, private notes, and duplicate prevention.
- Real-time request tracking, sharing, hospital maps/directions, donor offers, accept/decline, and consent-controlled contacts.
- Hospital verification/rejection, transactional donation confirmation, arranged units, fulfillment, completion, cancellation, and automatic expiry.
- ABO/Rh compatibility, eligibility, distance/readiness/reliability ranking, scheduled batches, and expanding-radius escalation.
- Inbox/read state, device push registration, deep links, push tickets/receipts, and invalid-token deactivation.
- Donor availability, pauses, notification/privacy preferences, matching area, eligibility, and history.
- Admin accounts/roles, hospital assignments and management, reports, analytics, matching policy, and audit records.
- Optional server-side DeepSeek summaries and suggested urgency, with deterministic fallback.

## Connect services later

Follow [docs/SETUP.md](./docs/SETUP.md). Preserve existing `.env.local` values and merge missing keys instead of overwriting the file.

```env
EXPO_PUBLIC_APP_MODE=live
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

The `.cloud` endpoint serves real-time data; `.site` serves Better Auth HTTP routes. Live mode with missing/invalid URLs shows a setup screen. It never silently substitutes demo success.

The backend includes the Better Auth component, indexed schema, functions, actions, HTTP routes, `/health`, scheduler, and expiry cron. `npx convex dev` regenerates the checked-in schema-derived bootstrap utilities with deployment-specific component types.

## Commands

Development test logins, the full request-to-donation flow, and every role's
feature checklist are in [docs/TESTING.md](./docs/TESTING.md). The internal seed
creates real Better Auth accounts on the development deployment and preserves
existing data when run again.

```powershell
npm start
npm run web
npm run lint
npm run typecheck
npm test
npm run format
npm run backend
npm run doctor
```

Install additions with `npx expo install <package>`. npm is retained with `package-lock.json`. `.npmrc` avoids installing Better Auth’s optional SQL/framework peer dependencies; this project uses its Convex adapter. Auth and its Expo plugin are pinned to compatible versions.

## Structure

```text
src/app/            Expo Router screens and layouts only
src/components/     Shared mobile UI and platform-specific hospital maps
src/providers/      Separate demo/live state and typed command dispatch
src/domain/         Types, validators, compatibility, eligibility and ranking
src/data/           Fictional data and interactive demo lifecycle
src/hooks/          Location and notification permissions/deep links
src/lib/            Configuration and auth client
convex/             Schema, auth, queries, mutations, actions, HTTP and crons
convex/lib/         Server authorization, validation and auditing
tests/              Domain, demo lifecycle and actual Convex function tests
docs/               Connection guide and architecture
```

## Security and practical limits

Signup only grants donor or requester access. The backend checks identity, active account, ownership, role, and hospital scope. Coordinator/admin grants require an administrator; the first admin is bootstrapped with an internal project-owner command.

Donor coordinates are rounded and visible only in the donor’s own profile. Requesters receive approximate distances. Emails/phones are private; donor phone sharing requires acceptance and consent. Notes are restricted to the requester and authorized care team, and never enter push payloads or the DeepSeek prompt.

This MVP supports whole-blood/red-cell compatibility, not clinical screening. Default preliminary policy is age 18–65 and a 90-day interval, configurable by an administrator. Each confirmed donor contributes one recorded unit. Receiving facilities must review policy and perform final medical screening.

Dashboard data is bounded to recent records; analytics describe that loaded window. Historical pagination and large-scale aggregate reporting are future work. Distances are approximate straight-line distances. Push requires a physical device and a development/production build. Web displays hospital address/directions instead of the native map.

Service accounts, credentials, sender-domain verification, native Maps configuration, FCM/APNs signing, and EAS builds are completed when you connect services. Offline tests mock the external identity adapter; real auth issuance, native push and maps require connected-device testing. Social sign-in, SMS, passkeys, payments, clinical diagnosis, transport, and predictive AI remain outside this MVP.
