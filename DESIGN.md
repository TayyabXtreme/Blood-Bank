---
version: alpha
name: Blood Bank
description: Warm, reassuring mobile blood donation interfaces matching the approved authentication and onboarding boards.
colors:
  primary: "#bb1820"
  background: "#fff8f5"
  surface: "#fffbf9"
  heading: "#600b0f"
  text: "#3d3433"
  muted: "#75635f"
  border: "#8a2428"
  divider: "#edd3cf"
  blush: "#fbe1df"
  success: "#2b8954"
typography:
  body:
    fontFamily: "Outfit-Regular"
    fontSize: "21px"
    lineHeight: "28px"
  heading:
    fontFamily: "Outfit-Bold"
    fontSize: "35px"
    lineHeight: "42px"
  display:
    fontFamily: "Outfit-ExtraBold"
rounded:
  field: "21px"
  card: "20px"
  pill: "999px"
spacing:
  page: "25px"
  field-gap: "16px"
  section-gap: "32px"
components:
  button:
    minHeight: "62px"
  field:
    minHeight: "64px"
---

# Blood Bank design system

## Overview

The approved boards in `design/references/` govern this native Android/iOS app. Authentication uses a pale ivory and blush photographic background, geometric rounded typography, a split blood-drop mark, thin burgundy input borders and deep red pill actions. The welcome screen's realistic donation hands and red blood-group cubes carry the strongest visual expression. Forms remain quiet and familiar.

Current language is English; no additional market or localization requirement has been confirmed. The product serves donors and requesters on phones; staff privileges are never selectable during onboarding. The current work is a frontend preview, with real authentication and server profile creation awaiting the planned Better Auth/Convex integration.

`src/theme/tokens.ts` owns runtime values. This document mirrors accepted values and explains their use. Components import native tokens directly; there is no parallel CSS/Tailwind color system. React Native StyleSheet keeps the same styling on Android, iOS, and the web preview.

## Colors

Primary red identifies navigation and affirmative actions. Burgundy identifies headings and fine outlines. Blush is decorative, never an error or status by itself. Success panels use pale green with a check icon and explicit text. All text and actions require readable contrast; pale colors are used only for backgrounds and dividers. The approved light appearance is fixed for this batch.

## Typography

Outfit regular, semibold, bold and extra-bold are bundled static fonts under `assets/fonts/` with the OFL license. Body copy is 21/28; labels and button text use semibold; form headings are 35/42; the welcome display is 43/44. Native text scaling remains enabled. Headings may wrap at narrow widths; essential form text is never truncated.

## Layout

ScreenShell owns safe areas, keyboard avoidance and vertical form scrolling. The mobile frame is full width on devices and bounded to 440 pixels in desktop previews. Horizontal padding is 25 pixels. Forms have 16-pixel field gaps. Short phones scroll rather than clip. Welcome art is positioned separately from real controls, and desktop side gutters belong only to the preview.

## Elevation & Depth

Fine raster grain and photographic blood cells provide depth without card shadows. Inputs and buttons are flat. The welcome illustration remains a separate transparent image asset. Use no replacement CSS drawings, fabricated SVG artwork or full-screen screenshot backgrounds containing controls.

## Shapes

Actions are pills; inputs use 21-pixel corners and notices use 20-pixel corners. Thin borders reflect the approved board. Standard icons use Feather; custom branding and photographic illustrations are raster assets derived with ImageGen from the approved references.

## Components

Canonical owners: `src/components/auth/ui.tsx` owns ScreenShell, Brand, Button, TextLink, Field, Notice, Dots and Divider. `src/components/onboarding/ui.tsx` owns onboarding stage/navigation patterns. Brand supports vertical auth and horizontal onboarding variants. Field supports a visible placeholder distinct from its accessible name.

Button variants are solid and outline, with fixed geometry during busy state, visible focus, hover/pressed treatment and disabled semantics. Field shows burgundy focus and inline textual errors. Notice uses a persistent accessible live region with text plus icon. These owners must be reused in subsequent approved screens.

## Do's and Don'ts

Match the approved imagery, density and visual hierarchy. Keep controls functional and maintain native keyboard/safe-area behavior. Show honest local-preview feedback for unavailable integrations. Never imply account creation, email delivery, email verification or backend persistence has completed until the actual service confirms it. Follow Plan.md and the approved scope before adding routes or product behavior.
