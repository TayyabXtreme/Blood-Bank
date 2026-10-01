# Authentication artwork

These production raster assets were generated with the built-in ImageGen tool from the user-approved board persisted in `design/references/auth-approved.png`. No screen is implemented as a screenshot.

Prompt set: extract/recreate the welcome's two realistic donation hands with red translucent blood-group cubes on transparent background; extract/recreate the standalone split blood-drop mark; extract/recreate the blush open verification envelope illustration on transparent background; recreate the splash's pale ivory/blush grain and corner blood cells without UI; recreate the signin form's ivory/blush grain with only the lower-right blood cell and no UI. All prompts required preservation of the approved visual direction, removed phone frames/text/controls, and requested standalone production assets. Original ImageGen files remain in the Codex generated-images directory.

`welcome-art.png`, `blood-drop.png`, `verification-art.png`, `auth-background.png` and `form-background.png` are consumed by native shared components and routes. Standard interface icons use Feather from @expo/vector-icons. Fonts are bundled separately under `assets/fonts/` with their license.
