# 054 Browser OAuth Logo Assets

## Goal

Create reusable SKAI logo image assets for browser tab icons and external auth/OAuth branding settings.

## Scope

- Add static square logo files under `public/`.
- Use the existing 3-node directed graph mark, not a flame icon.
- Add metadata icon declarations in `app/layout.tsx` so browsers can discover the icon.
- Generate PNG variants for external services that do not accept SVG cleanly.
- Record the public paths in documentation.

## Assumptions

- Browser tab favicon can use SVG in modern Chrome, with PNG fallbacks.
- OAuth/Supabase/Google branding fields may prefer or require a raster image URL, so `512x512` PNG is the safest asset.
- The logo should remain a mark-only asset. Wordmark/full lockup is not appropriate for tiny favicon surfaces.

## Affected Files

- `app/layout.tsx`
- `public/skai-mark.svg`
- `public/favicon.svg`
- `public/skai-mark-512.png`
- `public/skai-mark-192.png`
- `public/apple-touch-icon.png`
- `docs/design/004_logo_asset_usage.md`
- `docs/000_orchestration.md`

## Implementation Steps

1. Add the square SVG mark assets.
2. Generate PNG assets from the SVG.
3. Wire `metadata.icons`.
4. Document which file to use for browser and OAuth/Supabase branding.
5. Verify typecheck/lint/build.

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Check local asset responses for `/favicon.svg` and `/skai-mark-512.png`.

## Implementation Result

- Added `public/favicon.svg` and `public/skai-mark.svg`.
- Generated `public/skai-mark-512.png`, `public/skai-mark-192.png`, and `public/apple-touch-icon.png` from the SVG mark.
- Added Next metadata icon declarations in `app/layout.tsx`.
- Added usage guidance in `docs/design/004_logo_asset_usage.md`.
- Added `TDR-083` to the technical decision register.
- Verified local HTTP `200 OK` for `/favicon.svg` and `/skai-mark-512.png`.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- `curl -I -L http://127.0.0.1:3000/favicon.svg`: `200 OK`.
- `curl -I -L http://127.0.0.1:3000/skai-mark-512.png`: `200 OK`.

## External URL

After deployment, use this path for Supabase/Google/OAuth branding fields:

```text
https://<your deployed SKAI domain>/skai-mark-512.png
```

## Philosophy Check

The external logo asset should make SKAI recognizable without shifting the identity from the graph to a literal flame. Capability/fire remains a textual origin metaphor; the product mark remains the directed graph.
