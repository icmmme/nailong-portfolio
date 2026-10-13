# English content update — 2026-10-13

- Site wordmark and document title: NAILONG.
- All 20 artwork titles use the corresponding classical artwork's English name; no original artist credits are displayed.
- Categories, descriptions, source labels, navigation descriptions, image alternatives, close buttons, and error placeholders are in English.
- Contact retains the animated ring and displays the three-line collection introduction beneath “Somewhere else.”
- Original JPEGs and source URLs are preserved. Original Chinese provenance files remain archival records.
- `src/content.ts` contains live content. `docs/nailong/content-en.json` supplies the English mapping when re-importing images. Keep both in sync if re-importing after editing titles or descriptions.
- The two Springtime entries remain separate works (16 and 18). Focus restoration uses stable project IDs rather than matching title text.

## Verification

- TypeScript check passed; 12 existing motion/math tests passed.
- Source verification passed for all 20 English titles/descriptions, IDs, categories, image SHA256 values, and local HTTP JPEG responses.
- Opened all 20 previews from Full in the browser: titles matched the selected entries, English descriptions and source links appeared, and all 20 images completed loading.
- Checked desktop gallery at 1440×900 and continuous preview opening/closing at 1920×1080.
- Checked long-title preview and Contact at 390×844, plus Contact at 320×740. No horizontal overflow in inspected content.
- Checked keyboard opening, Escape, and focus restoration for work 18 across a mobile-to-desktop resize.
- Profile and Contact English copy inspected in the browser.
- `rg` found no Han characters in `src` or `index.html`.
- Production build passed. The sandbox blocks esbuild subprocesses; the approved build was run outside that sandbox.

Screenshots are saved in `screenshots/english-*.png`. This update changes content and label layout; the previously recorded flow and expansion animations remain the same.
