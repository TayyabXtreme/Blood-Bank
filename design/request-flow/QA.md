# Request flow design review

Status: awaiting user's design approval. Design only; no implementation authorized for this new board.

Final board: C:/Users/TECHNOSELLERS/Desktop/Munib/Systems hackathon/Blood-Bank/design/request-flow/request-flow-board.png

Generated with the built-in ImageGen tool on 1 October 2026, Asia/Karachi. Original tool outputs preserved; v1 preserved locally. Final refinement corrects REQ-06 navigation to an inset deep red pill.

## Coverage

| Screen | Visible design |
|---|---|
| REQ-02 | Create step 1: all eight blood groups; B+ selected; units stepper set to 2 |
| REQ-03 | Create step 2: hospital search; Civil Hospital selected; Hyderabad location |
| REQ-04 | Create step 3: Normal/Urgent/Critical; Urgent selected; required-by date and relative time; optional description |
| REQ-05 | Create step 4: full review; edit details; submission; pending verification explicitly explained |
| REQ-06 | Tracking: verified, partially fulfilled; 1 of 2 coordinator-confirmed units; separate 2 accepted donors; six-state lifecycle timeline; Home/Requests/Alerts/Profile pill tabs |
| REQ-07 | Eligible cancellation confirmation sheet; cancel/keep controls; completion disabled pending permission and coordinator confirmation |

Grounded in Plan.md sections 14.7, 14.11, 5.3, 6.1, 6.3, requester capabilities REQ-13/REQ-14, and FR-REQ-10. Plan remains truncated at 14.11; no missing sections invented.

## Visual and semantic QA

- All six frames complete, front-on, labelled outside; no OS chrome or device bezel.
- Same droplet mark, Blood Bank wordmark, blush/ivory texture, rounded geometric typography, red outlined inputs, red pill CTAs, restrained source-style illustrations.
- Eight distinct blood-group chips checked. Main fields and CTAs readable in delivered board.
- Accepted donors are explicitly separate from confirmed donated units, with 2 accepted donors and only 1 confirmed unit. Only coordinator-confirmed donations count.
- Submission does not claim verification already happened.
- No public donor contact/location information, patient identification, medical eligibility guarantees, payments, transport, or appointment features.

## Review limitations / follow-through after approval

- Some timeline timestamps and helper copy are small at board preview size; inspect the full-resolution PNG.
- The cancellation sheet dims underlying content. The completion permission note remains visible but has lower contrast under that overlay.
- ImageGen renders a conceptual board, not exact pixel viewport exports; the requested logical target is 390 x 844 per app screen and must be enforced in an approved implementation.
- The required-by control uses 1 Oct 2026 and “Within 6 hours”. An implementation must resolve that relative input into a concrete required_before timestamp and expose accessible date/time editing.
- Exact eligible-cancellation/completion permission rules are not defined by the current plan; this is an eligible cancellation example and a conditional completion state, not an invented lifecycle permission policy.
- Empty/error/loading/keyboard states and alternate terminal tracking statuses are not separate frames in this assigned six-screen board.

Prompts: prompt.txt and refinement-prompt.txt in this folder. Both approved reference images and the original local inspiration screenshot were actually attached to the first generation.

No application code, package files, branches, server sessions, or Expo Go state changed. Lint/typecheck do not validate raster-only design artifacts and were not run.
