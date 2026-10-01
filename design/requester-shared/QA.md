# Requester and shared screen board

Status: Awaiting the user's design approval. Design only; no application code was changed.

Saved board: `C:/Users/TECHNOSELLERS/Desktop/Munib/Systems hackathon/Blood-Bank/design/requester-shared/requester-shared-board.png`

Screen coverage:
- HOME-01 — Requester home: Request Blood, active request progress, nearby request, compact statistics and emergency guidance.
- REQ-01 — Requests list: search, blood group/urgency/status/location filters, active/history choices and request cards.
- SHARED-01 — Alerts inbox: four request notifications, two unread, read/unread tabs and request links.
- SHARED-02 — Profile/edit, donor variant: editable personal/donor details, availability, preliminary eligibility guidance, preferences link and sign-out.
- SHARED-03 — Notification preferences: push permission/device settings, donor request alerts and in-app inbox information. No additional communication channels.

Visual QA:
- Approved split-droplet logo, blush/ivory palette, burgundy typography, fine red outlines and red pill actions retained. Four labelled tabs appear on main screens; preferences has back navigation.
- All five frames are complete and front-on with no device or OS chrome. Text is readable when enlarged; profile helper text and some metadata are small at board overview scale.
- Revision corrected the Alerts total to All (4) / Unread (2).
- Remaining issue: generated frame proportions and heights still vary slightly; the board is a visual reference, not an exact 390 x 844 pixel specification. Normalize individual frames before treating them as dimensional targets.
- Remaining issue: REQ-01 first card shows half-progress and 1 of 2 units arranged but omits the explicit Partially Fulfilled badge. HOME-01 includes the correct status. Restore that label during an approved refinement.

Generation: built-in imagegen. Original generation and revision each needed one retry after a connection failure. No CLI/API fallback used. Full briefs saved in prompt.txt and revision-prompt.txt. Attached actual approved auth/onboarding image paths and original inspiration path for first pass; attached generated board plus approved references for revision. Originals remain under .codex/generated_images.

Scope follows the current Plan.md and design/SCREEN-COVERAGE.md. Plan remains truncated at section 14.11; no later-section requirements were invented. No package changes, branch changes, Git network actions, servers or Expo Go changes were made. No implementation is authorized until explicit approval of this new board.
