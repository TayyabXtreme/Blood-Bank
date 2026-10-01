# Blood Bank

Expo mobile application for blood request coordination, compatible donor matching, hospital verification and confirmed donation tracking. Requirements: [Plan.md](Plan.md). Current branch: Frontend.

The core workflows use a real local Convex backend with persisted records and realtime subscriptions. The current entry point uses isolated, clearly labelled demo accounts while sign-in options are deferred. Better Auth packages are installed; authentication is not enabled yet.

## Features

- Requester home, four-step request creation, filtering, progress, cancellation/completion, reports and directions.
- Donor matching invitations, accept/decline/withdraw, availability and confirmed donation history.
- Hospital verification, rejection, ranked responses, collection confirmation and statistics.
- Admin users, roles, account status, hospitals, moderation, configuration and audit records.
- Securely stored demo session, onboarding, location permission, profile/preferences and realtime alerts.
- Compatibility, distance, screening policy, weighted ranking, staged escalation and automatic expiry on the server.
- Optional backend DeepSeek summaries and push delivery integration with truthful unavailable states.

## Run on your phone

```powershell
npm ci
$env:CONVEX_AGENT_MODE='anonymous'
npx convex dev
```

Follow [SETUP.md](SETUP.md) to enable the development sandbox, set the laptop Wi-Fi address in .env.local, start Expo and scan its QR in Expo Go. All four roles are accessible through Explore the app. Backend and Expo must remain running. Core testing needs no cloud credentials.

## Stack and architecture

Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router, React Hook Form and Convex. The mobile provider subscribes to role-scoped server snapshots and sends validated commands. The backend owns lifecycle rules, privacy, ranking, scheduling and confirmations; donor acceptance never increments collected units.

| Directory | Purpose |
| --- | --- |
| src/app | Expo Router screens and navigation |
| src/features | Role workflows, onboarding and data provider |
| src/components | Shared native UI |
| convex | Queries, mutations, actions, schema and scheduling |
| convex/lib | Validation, access, compatibility, scoring and eligibility |
| assets | App imagery and Outfit fonts |
| tests | Backend tests and live workflow smoke script |
| eas.json | Development, APK preview and production build profiles |

## Validate

```powershell
npx tsc --noEmit
npx expo lint
npx vitest run tests/backend.test.ts
node tests/backend-smoke.mjs
```

The live smoke creates a sample confirmed donation and therefore changes the test donor's eligibility. Run it only against the demo deployment.

## Environment and builds

See [.env.example](.env.example) and [SETUP.md](SETUP.md). API secrets belong in Convex deployment environment variables, never EXPO_PUBLIC variables. Disable DEMO_MODE outside development. Production requires authenticated identity integration, approved hospital screening policy and real institution records.

For a signed development build or APK, configure your Expo/EAS account and project, then run `npx eas-cli@latest build --profile development --platform android` or `npx eas-cli@latest build --profile preview --platform android`. Push delivery requires an appropriate mobile build and device registration. An APK, cloud demo URL and release screenshots have not been published yet.
