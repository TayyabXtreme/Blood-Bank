# Requester/shared implementation coordination

User approved HOME-01, REQ-01, SHARED-01, SHARED-02 and SHARED-03. Worker owns `(tabs)` routes/layout, `profile/notifications`, `src/components/blood`, and requester/profile feature helpers. Shared root layout, auth, packages, providers, onboarding and Convex domain modules belong to other workers.

In progress: reusable public request cards, tab bar, requester home, filters, alerts/read status, profile edits, notification preferences. Reuses shared auth Brand, Button, Field, Notice and ScreenShell plus canonical theme tokens. Dashboard body typography is the smaller scale shown in this board, while auth keeps its larger scale. All photos/illustrations reuse the real onboarding assets.

Integration needs being resolved from source as owners add their code: canonical auth/session hook and explicit preview-mode flag; live profile query/update; request summary/list query; notification inbox/read/preferences mutations. No guessed backend contracts or implicit sample accounts. Backend-connected logic will use the actual shared APIs once present.

Home dispatcher will import `src/features/donor/DonorHome.tsx` and render it for donor role. CTA routes are `/request/create` and `/request/[id]`. Donor detail links will use the actual donor route implemented by its owner. Splash and root layout are not edited here.

Preview actions must be labelled local only, and sign-out must call the real shared auth owner when connected. Preview state remains memory-only. No server, Git network, branch or package changes by this worker.
