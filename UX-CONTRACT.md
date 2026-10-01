# Blood Bank frontend behavior contract

Visual intent and runtime token mapping are documented in [DESIGN.md](DESIGN.md). Plan.md governs domain behavior. This contract covers the approved local authentication/onboarding preview.

| Capability | Canonical owner | Contract | Verification |
|---|---|---|---|
| Form | React Hook Form + shared Field | Validate required/format/minimum rules, inline errors, preserve non-secret drafts, focus invalid field | Expo lint/typecheck and rendered interaction tests |
| Navigation | Expo Router | Welcome → signup/signin; signup preview → verify-email; explicit preview link → onboarding; route/back navigation uses router | Browser flow + Android bundle |
| Feedback | Shared Notice | Persistent accessible inline notice, text/icon plus semantic tone, truthful local-preview state | Rendered text/screenshot |
| Scrolling | ScreenShell / native ScrollView | Safe areas and keyboard avoidance; form content scrolls on small phones | Mobile viewport plus physical-device review |
| Permissions | Onboarding device-location service | Actual foreground request, manual city fallback, bounded pending state, no exact coordinates retained | Device request/manual fallback |

Authentication is deliberately unconnected: no Clerk substitution, fake session, real password persistence, actual reset/verification email, or assertion of verified identity. Signin reports integration availability after valid local submission. Signup only passes an in-memory email to the preview and clears its password. Verification remains visibly local and allows an explicit onboarding preview path.

Onboarding drafts remain in memory, with requester/donor only. Staff role assignment is excluded. Form validation never determines final medical eligibility. Device location requests have an explanation and a manual city path. Notifications unavailable in this preview must be labeled honestly. Completion indicates local workflow progress, not saved server profile state.

Forms use native TextInput with accessible names, meaningful input/autofill types, visible keyboard focus, textual validation feedback and password visibility controls. Do not place passwords or personal draft values in URLs. Repeated submissions are disabled while busy. Native input scaling remains enabled; avoid overflow and clipped actions at short/narrow viewports.
