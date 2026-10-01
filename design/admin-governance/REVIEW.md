# Admin governance design board

Status: Awaiting user design approval. Design only; no implementation authorized for this new board.

Latest available board: admin-governance-v2.png. Chart correction remains incomplete; do not treat this as numerically verified.

## Coverage

- ADMIN-05: Reported request review/resolution, request reference, reporter, reason, details, status, resolved-by example. Source: Plan 4.4 ADM-08 and 11.8.
- ADMIN-06: Platform analytics with requests, confirmed donations, daily activity, request status. Source: Plan 4.4 ADM-10. All analytics values are illustrative demo data; detailed section 15 is absent from current Plan.
- ADMIN-07: Audit/activity log list with date/action/entity filters, user/entity search, metadata entry affordance. All six Plan 11.9 actions shown: REQUEST_CREATED, REQUEST_VERIFIED, REQUEST_REJECTED, DONOR_ACCEPTED, DONATION_CONFIRMED, ACCOUNT_SUSPENDED. Source: Plan 4.4 ADM-11 and 11.9.
- ADMIN-08: Configurable example matching weights 40/20/20/10/10, total 100%, blood compatibility/preliminary eligibility/availability as mandatory gates, final medical screening notice. Source: Plan 4.4 ADM-12 and 7.2.

## Visual QA

- Inspected approved auth/onboarding images, original reference image, and generated board directly.
- Four complete front-on mobile frames in a 2x2 board, with external screen IDs and no OS/device chrome.
- Brand droplet, wordmark, ivory/blush surface, burgundy typography, fine red outlines, red pill CTAs and labelled Home/Requests/Alerts/Profile navigation match the approved visual direction.
- All six audit actions and all five exact matching weight values are visible and legible. Mandatory gates are shown as locked required rules. No guessed donation intervals or invented security settings.
- No donor phone, email, exact home address or patient medical details exposed.
- Unresolved QA issue: ADMIN-06 v2 has corrected y-axis labels 0/10/20/30 but plotted points still fail to match the requested daily values. Visually the request series is roughly 15/20/28/22/18/17/26, which exceeds the summary total 128. The donation series likewise appears higher than the requested series. Numerical consistency is not verified; chart still needs correction before implementation approval. Demo data label does not resolve the mismatch.
- Prompt-v2.txt records the intended corrected daily request values 12,18,25,21,16,14,22 (sum128) and donation values 6,8,15,12,9,10,14 (sum74), with axis 0/10/20/30.
- A minor limitation is that this raster board shows static primary states, not expanded audit metadata, filter menus or save/resolution feedback states.

## Generation record

- Initial generation connection failure; retry succeeded.
- Targeted chart edit attempted twice, both failed with connection errors. No revised image was produced; do not mistake prompt-v2.txt for a generated v2 board.
- Follow-up authorized exactly one further built-in ImageGen edit using prompt-v2 and the v1 board. It succeeded and was saved as admin-governance-v2.png, but did not plot the exact supplied daily values. The layout/style and other screen content remain visibly preserved; chart and status-panel vertical spacing changed slightly.
- V2 generated source preserved at C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f65c-fdee-7c20-9676-67f7e4e5e798/exec-c7b3b167-ebbe-4348-8522-6d39c7c51094.png.
- V2 workspace copy: C:/Users/TECHNOSELLERS/Desktop/Munib/Systems hackathon/Blood-Bank/design/admin-governance/admin-governance-v2.png.
- Original successful image preserved at C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f65c-fdee-7c20-9676-67f7e4e5e798/exec-98e215b8-4da0-4cac-8f6b-edac28ccfdf6.png.
- Workspace copy: C:/Users/TECHNOSELLERS/Desktop/Munib/Systems hackathon/Blood-Bank/design/admin-governance/admin-governance-v1.png.
- Source image refs: approved authentication exec-a11a0a2b-b270-4388-9de3-472a7c8a118d.png and onboarding exec-eddd24ff-4428-4529-adf1-60b86caa546a.png from parent thread 01a0f603-a131-74b1-a504-0230ff2a4682; original local clipboard image also attached to ImageGen.
- Original inspiration: https://dribbble.com/shots/24159727-Blood-Donation-App-Design.
- Date anchor: 1 Oct 2026, Asia/Karachi.

Only files inside design/admin-governance were created. No application code, packages, branch, commits, remote operations, servers or Expo Go were changed.
