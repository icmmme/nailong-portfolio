# Mobile gallery and ring update — 2026-10-13

Subsequent revision: the floating drop decorations were removed from both mobile and desktop at the user's request. Ring refraction, movement, dimensions and HTML introduction remain. The notes and recording below describe the initial version before that removal.

## Changes

- Mobile and desktop now use the same WebGL gallery, continuous detail transition, mouse/touch lens and refractive ring. HTML is retained as the fallback instead of being selected automatically below 768px.
- Pointer gestures support horizontal and vertical browsing on compact screens, with direction locked after the 7px drag threshold. Dragging cannot trigger an artwork preview.
- Contact permits dragging the background gallery; Profile and artwork details block background browsing. Pointer cancellation, panel closure, blur and page hiding cancel active input.
- Mobile cards fit approximately 90% of the viewport width. Mobile render pixel ratio is capped at 1.25, and gallery GPU poster textures are limited to 1024px width. Original detail images are retained.
- Ring dimensions follow the viewport's short side. The black opening is smaller on desktop, the refractive edge is wider, and rotation continues beyond the previous 15-second cap.
- Glossy floating shapes reflect the scene: six on desktop and four on compact screens. Their arrangement avoids the introduction; typography is larger on desktop and adjusted for 320px screens.
- Reduced motion freezes the continuous visual animation and retains simplified previews. All effects share the existing renderer.

## Verification

- 14 math, motion and responsive layout tests passed.
- TypeScript check and production build using `/nailong-portfolio/` passed.
- Browser checks at 390×844: WebGL is active, the CSS fallback ring is absent, horizontal and vertical drags move cards without opening previews, and a card uses the continuous flight transition.
- Escape closes the preview and restores focus to its project ID. Full contains all 20 entries and returns to Featured.
- Contact dragging moves the gallery while the panel remains open.
- Checked Contact at 320×740, 390×844, 1440×900 and 1920×1080; corrected the 320px title spacing and repositioned the mobile floating objects.
- Checked viewport resize during a preview transition, forced HTML fallback preview, and reduced-motion mode.
- Browser reported no shader errors in the inspected local scenes.
- Captured 97 actual browser frames over about six seconds and encoded `screenshots/mobile-liquid-flow.mp4` with their timestamps. This is an animation record, not a frame-rate benchmark.

These browser tests use desktop pointer input at mobile viewport sizes. Real iOS/Android touch hardware and sustained device performance have not been measured in this session.
