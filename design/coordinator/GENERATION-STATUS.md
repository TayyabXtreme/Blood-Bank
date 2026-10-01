# Coordinator design board — generated, awaiting approval

Status: board generated and visually inspected; awaiting the user's design approval. No application implementation authorized for this board.

## Deliverable
- Saved image: C:/Users/TECHNOSELLERS/Desktop/Munib/Systems hackathon/Blood-Bank/design/coordinator/coordinator-board-v1.png.
- Image dimensions: 1024 x 1536 pixels, six distinct screens in a 3 x 2 board.
- Saved full prompt: coordinator-board-v1.prompt.txt.
- Built-in imagegen was attempted three times on 1 October 2026. Every attempt failed with: "image generation failed: connection failed: error sending request".
- After the user resumed the task, one additional built-in imagegen attempt succeeded on 1 October 2026. No CLI/API fallback used.
- Original output preserved at C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f65c-e6fe-7682-8774-d2501593d1e0/exec-54c5cc71-6021-4900-9164-bc4afd60035f.png.

## Full screen coverage
- COORD-01 — hospital coordination dashboard.
- COORD-02 — pending verification queue.
- COORD-03 — verification/rejection detail and confirmation of units required.
- COORD-04 — ranked compatible donors, match scores, approximate distances, donor responses and staged escalation.
- COORD-05 — confirmation of donated units and closure of a fulfilled request.
- COORD-06 — hospital analytics with modest illustrative request/donation/response data.

## Grounding
Read AGENTS.md, Plan.md and design/SCREEN-COVERAGE.md. Plan stops at section 14.11; no later section bodies were assumed.
Inspected the approved auth and onboarding boards and original supplied screenshot through view_image. All three actual local paths were attached to every generation request:
- C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f603-a131-74b1-a504-0230ff2a4682/exec-a11a0a2b-b270-4388-9de3-472a7c8a118d.png
- C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f603-a131-74b1-a504-0230ff2a4682/exec-eddd24ff-4428-4529-adf1-60b86caa546a.png
- C:/Users/TECHNO~1/AppData/Local/Temp/codex-clipboard-2f44c90a-2bd0-4c8c-9e82-06c49e290ad7.png

Product Design saved-context preflight completed and reported no saved user context. The established project brief and approved images supplied all necessary design context.

## QA
Prompt coverage was checked against the coordinator capabilities in Plan 4.3, matching in 7.1, responses in 6.3, and escalation in 10.4. Prompt specifies six complete 390x844 mobile frames in a 3x2 board, exact approved branding, no OS/device chrome, approximate donor distances, preliminary eligibility, native navigation, and sample operational analytics.
Inspected the saved board with view_image. All six labelled frames are complete, front-on, free of OS/device chrome, and contain their required controls. Palette, droplet wordmark, rounded outlines, deep-red pill CTAs and restrained hand/blood-cell imagery match the approved source direction. The donor list shows descending match scores, approximate distances and response statuses, plus staged escalation and preliminary screening guidance. Donation confirmation distinguishes accepted donors from confirmed units and previews fulfillment before closure. Analytics are explicitly sample data and use the correct Thursday-to-Wednesday dates for 24–30 September 2026.
Brief QA issues: the tool produced a 1024 x 1536 board rather than the requested larger ideal export; frames are conceptual native-mobile layouts rather than exact 390 x 844 pixel exports. Small donor/escalation helper text and chart labels should be checked at the actual implementation size. The Thursday chart bar has no printed numeric label (intended value 1), though its height is consistent with the sample series. No visibly clipped content or missing screen was found.
Source images are preserved. Only this assigned design/coordinator folder was written. No code/package changes, Git mutations, dependency commands, servers or Expo Go interaction occurred.

## Next step
Submit the saved board for the user's design approval before any implementation. Carry the minor chart-label and small-text QA notes into any approved implementation pass.
