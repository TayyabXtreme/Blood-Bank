# Connect BloodBank services

The demo works without credentials. Complete this setup before switching to live. Never put server secrets in `EXPO_PUBLIC_` variables or commit environment files.

## 1. Install and verify

```powershell
npm ci
npm run lint
npm run typecheck
npm test
```

Use npm with the included lockfile and `.npmrc`. Install additions with `npx expo install`.

## 2. Connect Convex

```powershell
npx convex dev
```

Choose your development project. This deploys schema/functions, registers the Better Auth component, and regenerates `convex/_generated/`. Keep it running during backend development.

Set server variables in the Convex dashboard:

| Variable             | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET` | At least 32 cryptographically random characters                          |
| `SITE_URL`           | Trusted web origin such as `http://localhost:8081`; omit for native-only |
| `RESEND_API_KEY`     | Password recovery and verification email                                 |
| `AUTH_EMAIL_FROM`    | Sender on your verified email domain                                     |
| `DEEPSEEK_API_KEY`   | Optional AI summary and suggested urgency                                |
| `EXPO_ACCESS_TOKEN`  | Only if Expo push access-token security is enabled                       |

Convex supplies `CONVEX_SITE_URL` to the backend. Generate the auth secret securely and enter it directly into the dashboard.

## 3. Configure the mobile client

Preserve `.env.local` if it exists. Otherwise copy `.env.example` to `.env.local`. Merge these keys using the URLs from your dashboard:

```env
EXPO_PUBLIC_APP_MODE=live
EXPO_PUBLIC_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://YOUR-DEPLOYMENT.convex.site
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Restart Expo after environment changes. Better Auth uses `/api/auth/*` on the `.site` URL. `/health` returns a non-sensitive health response. Native redirects use the `bloodbank` scheme. For web, match `SITE_URL` to your app origin for the cross-domain plugin/CORS.

## 4. Bootstrap an administrator

Register a live account and complete requester onboarding. As the Convex project owner, run the internal bootstrap command with your registered email:

```powershell
npx convex run setup:promoteFirstAdmin '{"email":"YOUR-REGISTERED-EMAIL"}'
```

This checks that no admin exists and records an audit event. Additional role grants use the admin UI. This internal function is not exposed to mobile clients.

## 5. Add facilities and coordinators

In Profile → Platform administration → Hospitals, enter real facility details and public coordinates. Confirm the information and enable Facility verified. New requests require a verified active facility. Sample demo hospitals are never automatically imported into your live database.

Have a coordinator register and finish onboarding. Grant coordinator access and assign their hospital in People & roles. Their verification and donation confirmation permissions are restricted to that hospital.

## 6. Resend email

Verify your sender domain in Resend. Set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` on Convex. Signup/signin work without email delivery; password recovery and optional verification need these values and surface errors until configured.

Native reset links return to `bloodbank://reset-password`; web links return to `/reset-password`. Resetting a password revokes existing sessions. Email verification is optional in the MVP. The small `sendEmail` adapter in `convex/auth.ts` can be replaced if needed.

## 7. EAS and push

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile development --platform android
```

Store your EAS project ID in `EXPO_PUBLIC_EAS_PROJECT_ID`. Configure FCM/APNs credentials with EAS and supply public Convex URLs to live builds through EAS environment configuration. Do not place backend secrets in public build variables.

Install a development build on a physical device. Profile → Push alerts requests permission, creates the Android channel, obtains an Expo push token, and associates it with the authenticated account. Request notifications open the detail route after auth/onboarding. Delivery tickets/receipts and invalid-token deactivation are handled by Convex.

```powershell
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios
```

Preview produces a demo APK; development/production use live mode. Choose your own Android package and iOS bundle identifier before distribution if `com.bloodbank.mobile` is not appropriate. Native folders are generated through Expo and must not be edited by hand.

## 8. Native maps

iOS defaults to Apple Maps. Android binaries require a Google Maps SDK key restricted to your package/signing certificate. Enable Maps SDK for Android and set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` before building. `app.config.ts` injects it into native configuration. This key is embedded in the app; protect it with Google Cloud restrictions.

Maps show public hospital coordinates, never donor home pins. The web preview uses an address card and external directions.

## 9. Optional DeepSeek

Set `DEEPSEEK_API_KEY` on Convex. The prompt includes only blood group, units, chosen urgency, hospital, and time remaining. Structured output is validated. AI does not change the chosen urgency or determine eligibility. Failures fall back to a deterministic summary without blocking creation.

## 10. Connected acceptance checks

1. Register compatible requester/donor accounts near the real facility.
2. Complete the donor declaration and availability.
3. Create a request and confirm Pending verification.
4. Verify it as the assigned hospital coordinator.
5. Confirm eligible donors receive ranked offers and inbox alerts.
6. Accept as the donor; arranged units must remain unchanged.
7. Perform facility screening/donation, then confirm as the coordinator.
8. Confirm the unit count/history and donor cooldown update.
9. Complete the fulfilled request and verify matching stops.
10. Exercise rejection, cancellation, expiry, reports, and denied cross-hospital access.

Automated backend tests run real Convex queries/mutations in a local test database with only the external identity adapter mocked. Better Auth issuance, real email delivery, native push/maps, and EAS binaries require verification after connecting services.
