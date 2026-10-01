# BloodBank feature walkthrough

## Development logins

Use **Already a member? Sign in**. Live mode is enabled in `.env.local`.
These fictional accounts are created by the development seed, not by public signup.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@demo.bloodbank.test | BloodBankDemo!2026 |
| Hospital coordinator | coordinator@demo.bloodbank.test | BloodBankDemo!2026 |
| Requester | requester@demo.bloodbank.test | BloodBankDemo!2026 |
| Donor | donor@demo.bloodbank.test | BloodBankDemo!2026 |

Extra matching donors use `sample0@demo.bloodbank.test` through
`sample5@demo.bloodbank.test` and the same test password. The coordinator belongs
to **Sample — Civil Hospital** in Hyderabad. The primary donor has O+ blood.
All facilities and requests created by the seed are test fixtures.

Start with `npm start`, reload the app, and sign in. Use **Profile → Sign out**
before changing roles. Accounts should open their dashboards without onboarding.
For a new account, use signup and complete the donor/requester onboarding flow.
Coordinator/admin roles can only be assigned by an administrator.

## Full request-to-donation flow

1. **Requester:** open Requests, create a request for **O+**, one unit, at
   **Sample — Civil Hospital**, with a future deadline. Submit for verification.
   Open its details and confirm it is pending; it should appear under your requests.
2. **Coordinator:** sign out, sign in as coordinator, open the care dashboard and
   **Review pending requests**. Open that O+ request and choose **Verify and begin
   matching**. Wait briefly for the backend to create compatible offers.
3. **Donor:** sign in as donor, open **Incoming requests**, then accept that O+
   request. Check that its status changes and the alert appears in Inbox.
4. **Coordinator:** open the same request, find its accepted donor response, and
   choose **Confirm screened donation**. Confirm this test donation only.
5. **Requester:** verify one unit is arranged, then choose **Mark request completed**.
6. **Donor:** open donation history and check for the new record. Availability
   should now show the waiting period from the confirmed donation date.

To test declining an offer, use another compatible sample donor before it accepts
a different active request. To test a rejected request, create a separate request
and reject it as coordinator with a reason. Cancel another request as requester.
Expired requests close automatically after their deadlines.

## Donor features

- Browse and search verified requests, filter by blood group and status, and open details.
- Check Incoming requests, accept/decline offers, and review past donation history.
- In Profile, update availability, pause for seven days, change contact sharing,
  alert preferences, or the last donation date. Restore the old eligibility values
  before repeating matching tests.
- Update your matching area by selecting a city or granting location permission.
- In Inbox, open an alert and mark messages read. View directions to a test facility.

## Coordinator features

- Review the seeded pending O− request at the assigned Civil Hospital.
- Verify or reject pending requests with a reason.
- Monitor active requests and compatible responses, then confirm screened donations.
- Requests belonging to other hospitals must not expose coordinator-only controls.

## Administrator features

Open **Manage the platform** on Home or the administrator tools in Profile.

| Page | Check |
| --- | --- |
| People | Search accounts; edit a sample donor; assign a coordinator's hospital; suspend and reactivate a sample account. Keep your administrator active. |
| Hospitals | Add a fictional receiving facility; edit its address and coordinates; change active/verified state. |
| Requests | Filter stages, verify pending requests, inspect responses and close test requests. |
| Reports | Open the seeded concern, resolve or dismiss it; submit another concern from request details as donor. |
| Analytics | Check demand by blood group/city, request states and confirmed donations. |
| Settings | Adjust matching radius, batch size, age/interval policy and scoring weights; save and restore values after testing. |
| Audit | Check entries after verification, role changes, settings updates and donation confirmation. |

## Authentication and connected services

- Wrong passwords should show an error. Sign out and reopen the app to check session behavior.
- Signup creates donor/requester accounts; it must not grant administrator access.
- Seed emails use the reserved `.test` domain and cannot receive real email. Test
  password reset and verification with your own real account and a working Resend
  sender configuration.
- Push delivery needs a physical device, notification permission and a development
  build/EAS project configuration. Inbox works independently of push delivery.
- Device location requires permission. Native maps and external directions require
  platform configuration. AI summaries use the configured provider when available;
  deterministic matching does not require an AI key.

## Seed again safely

The owner can run these commands from the project directory:

```powershell
node node_modules/convex/bin/main.js run seed:run '{"password":"BloodBankDemo!2026"}'
node node_modules/convex/bin/main.js run seedData:status '{}'
```

The seed is internal, restricted to `woozy-setter-248`, and records completion in
`seedRuns`. Rerunning preserves existing accounts, passwords and fixture edits;
it does not reset completed/expired requests. Create fresh requests for repeated
flow tests. Never reuse these public test credentials for production accounts.

For local, resettable fixtures, set `EXPO_PUBLIC_APP_MODE=demo`, restart Expo, and
choose a demo role. Demo mode does not modify Convex data.
