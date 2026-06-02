# Logo Asset Usage

## Canonical Mark

SKAI's external icon asset is the 3-node directed graph mark:

```text
intent/material nodes -> artifact node
```

The mark should not be replaced by a literal flame icon. Fire remains the product's origin metaphor and home headline language, while the logo system remains graph-first.

## Files

- `public/favicon.svg`
  - Browser tab favicon.
  - Registered in Next metadata.
- `public/skai-mark.svg`
  - Canonical square SVG mark for web use.
- `public/skai-mark-512.png`
  - Best default for Supabase/Google/OAuth branding fields when a public image URL is needed.
  - Use deployed URL form: `https://<domain>/skai-mark-512.png`.
- `public/skai-mark-192.png`
  - PNG fallback and app icon size.
- `public/apple-touch-icon.png`
  - Apple touch icon.

## Supabase / OAuth Usage

If a provider asks for a logo image URL, use:

```text
https://<your deployed SKAI domain>/skai-mark-512.png
```

For local development this file exists at:

```text
http://127.0.0.1:3000/skai-mark-512.png
```

External OAuth branding screens usually cannot fetch a localhost URL, so the final value should be set after deployment.

## Visual Rules

- Use the square mark for favicon, OAuth, app icons, and small surfaces.
- Use the full lockup only in product UI where text can remain legible.
- Do not add flame shapes, gradient orbs, mascot imagery, or provider-specific visual motifs to the logo asset.
