# 074 SKAI Extension Viewer Export Verification

Date: 2026-06-04

## Goal

Connect the `.skai` extension system to the real development workflow:

```text
fixture -> extension -> unified viewer -> export hook -> verification command -> deployment
```

This slice should require no new product philosophy decisions. It locks the engineering loop so future LLM judge/coaching work can iterate without touching `.skai` core or splitting viewer surfaces.

## Scope

Included:

- Add an optional extension hook to `.skai` export helpers.
- Keep extension attachment outside `.skai` core payload.
- Polish the public share embedded viewer and old snapshot fallback copy.
- Add a viewer fixture smoke script for derived `.judged.skai` artifacts.
- Add a single `verify:skai` command for CI-style local checks.
- Update docs with the concrete command and export hook.
- Push and check Vercel after implementation.

Excluded:

- Live LLM judge execution.
- Supabase schema changes.
- Server-side PDF generation.
- New viewer surface.

## Affected Files

- `lib/skai-format.ts`
- `components/skai-file-viewer.tsx`
- `components/share-attempt-client.tsx`
- `app/globals.css`
- `scripts/skai_viewer_fixture_smoke.mjs`
- `package.json`
- `docs/technical/015_skai_file_format.md`
- `docs/000_orchestration.md`
- `docs/technical/plan/074_skai_extension_viewer_export_verification.md`

## Implementation Steps

1. Add `attachSkaiFileExtensions` and `extensions` input support to `buildSkaiFileArtifact`.
2. Make `SkaiFileViewer` support an embedded variant without creating a second viewer.
3. Use the embedded variant in public share and tighten old snapshot fallback copy.
4. Add `skai:viewer-smoke` to validate derived fixture fields used by the viewer.
5. Add `verify:skai` to chain `.skai` validation, viewer smoke, judge regression, typecheck, and lint.
6. Update docs.
7. Run verification, commit, push, and confirm Vercel route health.

## Verification

- `npm run skai:validate`
- `npm run skai:viewer-smoke`
- `npm run judge:regression`
- `npm run verify:skai`
- `conda run -n SKAI npm run build`

## Risks

- Extension hook can accidentally imply extensions are core. Keep docs explicit.
- Embedded viewer can become a separate surface. Use the same `SkaiFileViewer` with a variant prop only.
- Viewer smoke is structural, not visual. Browser/Vercel checks still matter.

## Rollback Notes

- Remove `attachSkaiFileExtensions` and `extensions` input if extension export proves premature.
- Remove `skai:viewer-smoke` and `verify:skai` scripts without affecting runtime.

## Implementation Result

- Added `attachSkaiFileExtensions` and `extensions` input support to `buildSkaiFileArtifact`.
- Kept extensions top-level and outside `.skai` core payload.
- Added `variant="embedded"` to the canonical `SkaiFileViewer`.
- Public share now embeds the same viewer with the embedded variant and clearer old snapshot fallback copy.
- Added `scripts/skai_viewer_fixture_smoke.mjs`.
- Added `skai:viewer-smoke` and `verify:skai` package scripts.
- Updated `.skai` format and orchestration docs with the concrete extension export/development loop.

## Verification Result

- `npm run skai:validate`: passed.
- `npm run skai:viewer-smoke`: passed.
- `npm run verify:skai`: passed.
- `conda run -n SKAI npm run build`: passed.
