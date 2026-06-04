# 072 Unified SKAI File Viewer

Date: 2026-06-04

## Goal

Build one unified `.skai` viewer surface and reuse it for:

- public share pages;
- local `.skai` file opening/import;
- `.skai` saving/downloading;
- share-link copying/native sharing;
- browser print/PDF generation.

Do not create separate viewers for share, import, and PDF. The file format must have one canonical reading surface.

## Scope

Included:

- `components/skai-file-viewer.tsx` as the single viewer component;
- viewer actions:
  - save `.skai`;
  - copy/share URL when available;
  - print/PDF through browser print;
  - integrity verification;
- graph-first rendering using `ConversationGraphView`;
- optional parent/child graph comparison when `.skai` contains parent graph + parent trace;
- `/skai/viewer` drag-and-drop/import page using the same component;
- share page embeds the same viewer when `PublishedAttempt.skaiFile` exists;
- print CSS so PDF output uses the unified viewer surface.

Excluded:

- native macOS file association;
- Electron/native app;
- signed certification;
- binary material bundle;
- deep import into local attempt storage;
- replacing all existing rich share analysis sections.

## Architecture

One reusable component:

```text
SkaiFileViewer
  input: SkaiFileArtifact
  optional shareUrl
  optional title prefix
  actions: save / share / print / verify
  rendering:
    manifest/source/integrity
    graph stats
    3D Dual Graph
    optional parent-child comparison
    raw trace evidence
```

Two entry points:

```text
/share/[attemptId] -> embeds SkaiFileViewer from PublishedAttempt.skaiFile
/skai/viewer -> drag/drop .skai -> embeds same SkaiFileViewer
```

## Rationale

This keeps `.skai` as one portable artifact instead of creating separate UI dialects. Share pages can still show rich SKAI analysis below or above, but the `.skai` reading layer remains a single component.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

Manual smoke:

- open a published attempt with `.skai`;
- confirm unified viewer appears;
- save `.skai`;
- click print/PDF;
- open `/skai/viewer`;
- drag/drop or choose the saved `.skai`;
- confirm same viewer renders graph and integrity status.

## Implementation Result

- Added `components/skai-file-viewer.tsx` as the single `.skai` viewer surface.
- Added `/skai/viewer` import page.
- Public share page embeds `SkaiFileViewer` when a `.skai` snapshot exists.
- Moved `.skai` save/share/PDF behavior into `SkaiFileViewer`.
- Added integrity verification display using `verifySkaiFileArtifact`.
- Added browser print/PDF styling so the viewer is the print surface.
- Kept existing rich share analysis as additional SKAI analysis, not as a separate `.skai` viewer.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Risks

- A viewer that shows too much can become another analysis dashboard. Keep it core-format first.
- Browser print is not a full PDF renderer. It is acceptable for MVP; dedicated server-side PDF can come later.
- Existing old published snapshots may not have `.skai`; share page should degrade gracefully.

## Philosophy Check

This viewer reinforces `.skai` as a graph artifact, not a transcript dump. The watchpoint is to keep analysis extensions optional and avoid letting the viewer become a score report surface.
