# Donor board review

Status: awaiting user's design approval. Design only; no application implementation performed.

Date: 1 October 2026, Asia/Karachi.

Image: `donor-board-v1.png` (1024 x 1536 raster board).
Prompt: `prompt-v1.txt`.
Generation: built-in ImageGen, successful on second attempt after a connection error. Original generated image preserved at `C:/Users/TECHNOSELLERS/.codex/generated_images/01a0f65c-e094-7f72-a2c7-90afc34718a1/exec-57dda0cb-d95d-4391-b7b9-8eb225872166.png`.

## Covered screens

- HOME-02 Donor home: availability, preliminary eligibility with hospital screening explanation, nearby emergency request, last completed donation, total completed donations and B+ blood group.
- DON-01 Incoming/accepted requests list: Incoming/Accepted segmented control, compatible incoming cards and accepted coordination preview.
- DON-02 Donor request details: blood group, urgency, hospital, approximate distance, units, relative required-by time, verification and summary; Decline/Accept actions.
- DON-03 Accepted coordination: hospital/address, illustrative directions map, coordinator call action with permission notice, required time and request status; coordinator confirmation explanation.
- DON-04 Availability: paused toggle, pause-until date/time, save and resume controls; accepted requests remain accessible.
- DON-05 Donation history: six confirmed B+ donation records, each one unit; total six completed donations.

## Visual QA

- All six complete front-on frames and external IDs are visible. No OS chrome, device bezels or perspective.
- Logo, rounded typography, burgundy/red hierarchy, pale blush textures, fine outlines and pill controls follow the supplied approved auth/onboarding images.
- All four labelled tabs (Home, Requests, Alerts, Profile) are present on every frame with the appropriate active tab.
- No donor exact home position, public donor contact, patient identity, appointment scheduling, transport or payment features are shown.
- Medical eligibility is explicitly preliminary; final screening belongs to the receiving hospital. Accepted requests do not count as completed donations.
- Address and map are illustrative mock data, with the address labelled as an example. No fabricated coordinator phone number is shown.
- No visible spelling or coverage omissions found. Small supporting/history text needs full-size inspection; the overview raster is not proof of native accessibility or touch target measurements.
- Requested logical viewport is 390 x 844 per screen. Generated panels are approximately 305 x 724 within a 1024 x 1536 board, so exact 390 x 844 proportions and native text sizing remain to be verified during approved implementation.

## Approval gate

Awaiting explicit approval of this new board before implementation, per the user's design-first working agreement in `design/SCREEN-COVERAGE.md`.
