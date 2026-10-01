# Blood Bank development

The current implementation runs on branch `Frontend`. The latest requirements are in `Plan.md` (fetched from `origin/main`). Core workflows use a persistent local Convex database and realtime subscriptions. Sign-in is deferred; clearly marked demo profiles share an isolated sample dataset.

Start the backend in this project:

```powershell
$env:CONVEX_AGENT_MODE='anonymous'
npx convex dev
```

In a second terminal, enable the development sandbox once:

```powershell
npx convex env set DEMO_MODE true
```

The CLI creates `.env.local`. For a physical phone, replace `EXPO_PUBLIC_CONVEX_URL` with `http://YOUR_WIFI_IPV4:3210` and `EXPO_PUBLIC_CONVEX_SITE_URL` with `http://YOUR_WIFI_IPV4:3211`. Find the laptop Wi-Fi address using `Get-NetIPAddress -AddressFamily IPv4`. Restart Expo after changing environment variables.

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME='YOUR_WIFI_IPV4'
npx expo start --go --lan --port 8081
```

Scan the QR in Expo Go on the same Wi-Fi. Keep both terminals running. Metro delivers frontend changes; Convex dev deploys backend changes. Use **Explore the app** to test Requester, Donor, Hospital coordinator, and Administrator. Sign out under Profile to switch roles. Sample actions update the actual local database and appear across devices.

Implemented flows: request creation and filtering, hospital verification/rejection, staged compatibility/distance/eligibility ranking, donor accept/decline/withdraw, expiry/escalation, staff-confirmed donations and history, alerts/read states, profile/preferences, hospital directions, abuse reports, scoped coordinator analytics, admin users/roles/hospitals/configuration/audit.

For a full scenario: create a request as Requester, verify at its receiving hospital as Coordinator (or Admin), accept a matched invitation as Donor, confirm collection as authorized staff, and complete the fulfilled request as its requester.

Optional server environment variables:

| Variable | Purpose |
| --- | --- |
| `DEMO_MODE` | `true` for isolated test accounts only. Disable for production. |
| `DEEPSEEK_API_KEY` | Server-only optional request summarization. No key is needed for core workflows. |
| `EXPO_ACCESS_TOKEN` | Server-only Expo push authorization. Production push also requires registered devices, an EAS project and a development/production build. Expo Go testing uses realtime in-app alerts. |

Production requires authenticated identity integration (Better Auth dependencies are installed), cloud Convex configuration, an institution-approved donor screening policy, hospital onboarding, and device push registration/build credentials. Demo eligibility thresholds are labelled simulations and must not be adopted as clinical policy. External services are reported unavailable when credentials are absent.

Validation:

```powershell
npx tsc --noEmit
npx expo lint
npx vitest run tests/backend.test.ts
```

Local deployment data and `.env.local` must stay out of Git. Changes have not been pushed to GitHub.
