# SKAI File Format v1

Date: 2026-06-04

## Status

Implemented baseline: `.skai` as `application/vnd.skai+json`.

The first `.skai` format is a canonical JSON artifact with section-level SHA-256 hashes. It is intentionally not a zip bundle yet. The goal is to make AI orchestration history portable, inspectable, and integrity-checkable before adding binary materials, signatures, or certification layers.

## Core Idea

`.skai` is not a chat export.

It is a graph artifact:

```text
problem + materials
-> prompt/response trace
-> 3D Dual Graph
-> optional structural branch snapshot
-> integrity hash
```

The transcript is included only as one section of a larger orchestration artifact. The primary backbone is trace + graph. Judge reports, skeletons, overlays, and visual summaries are analysis extensions, not core `.skai` payload.

## Extension

```text
*.skai
```

## MIME Type

```text
application/vnd.skai+json
```

## Schema Version

```text
skai.file.v1
```

## Top-Level Shape

```json
{
  "format": "SKAI",
  "schemaVersion": "skai.file.v1",
  "mimeType": "application/vnd.skai+json",
  "extension": ".skai",
  "createdAt": "2026-06-04T00:00:00.000Z",
  "manifest": {},
  "payload": {},
  "integrity": {}
}
```

## Manifest

The manifest explains what this artifact is and how it was produced.

```json
{
  "artifactId": "skai:attempt-id:created-at",
  "title": "Attempt title",
  "problemId": "problem-id",
  "attemptId": "attempt-id",
  "parentAttemptId": "optional-parent-attempt-id",
  "source": {
    "platform": "skai",
    "conversationId": "attempt-id",
    "exportedFrom": "skai-web",
    "primaryProvider": "gemini",
    "primaryModel": "gemini-2.5-flash-lite"
  },
  "createdAt": "2026-06-04T00:00:00.000Z",
  "exportedBy": "skai",
  "schemaVersion": "skai.file.v1",
  "sections": ["problem", "attempt", "graph", "branch"],
  "privacy": {
    "rawTrace": "included",
    "contextDebug": "stripped",
    "attachmentBinary": "omitted",
    "attachmentText": "included_when_public"
  }
}
```

## Payload Sections

### `problem`

Public problem metadata and material manifest.

Binary material payloads are not embedded in v1. The extracted text hash is stored so later viewers can detect whether the text representation changed.

### `attempt`

The public attempt identity and sanitized trace.

Rules:

- `contextDebug` is stripped.
- attachment `dataUrl` is stripped.
- public trace text remains included.
- score report is not part of `.skai v1` core.

### `graph`

The structural backbone:

- `child`: child/current `ConversationGraph`;
- `parent`: optional parent `ConversationGraph` for branch replay.

Graph snapshots are projected from the app-provided `ConversationGraph`, but `.skai` core strips analysis fields:

- `annotations` is empty;
- annotation indexes are empty;
- judge-dependent `bottleneck` status is lowered to trace-derived structural status;
- prompt/response/status nodes, edges, pairs, structural index, and branch metadata remain.

This is the key share fix: public branch share can render parent/child graph comparison without local parent attempt state while keeping `.skai` lightweight.

### `branch`

Optional structural branch snapshot:

- parent attempt id;
- child attempt id;
- breakpoint trace event id;
- breakpoint trace index;
- breakpoint pair id;
- parent trace;
- child trace;

Counterfactual judge reports and graph transition analysis are not core fields.

## Integrity

v1 uses SHA-256 with stable JSON canonicalization.

```json
{
  "algorithm": "sha256",
  "canonicalization": "stable-json-v1",
  "sectionHashes": {
    "manifest": "...",
    "problem": "...",
    "attempt": "...",
    "graph": "...",
    "branch": "..."
  },
  "artifactHash": "..."
}
```

Important limitation:

- This is tamper evidence.
- This is not authorship proof.
- This is not institutional certification.
- Signature, public key identity, and verifier chain are future layers.

## Public Share Behavior

When a user publishes an attempt, SKAI builds `.skai` and stores it inside `PublishedAttempt.skaiFile`.

When a public share page opens:

1. Prefer the `.skai` graph snapshot.
2. If unavailable, rebuild graph from trace.
3. If parent graph exists in `.skai`, show parent/child graph comparison.
4. If parent graph is unavailable, fall back to graph transition summary.
5. Allow `.skai` download from the share page.

The share page may still use `PublishedAttempt.scoreReport` for rich in-app analysis. That does not make score report part of `.skai` core.

## Source Provenance

Core `.skai` includes source provenance because it is not judge-dependent analysis.

```json
{
  "source": {
    "platform": "skai",
    "conversationId": "attempt-id",
    "exportedFrom": "skai-web",
    "primaryProvider": "gemini",
    "primaryModel": "gemini-2.5-flash-lite"
  }
}
```

For SKAI-native artifacts, `conversationId` is the attempt id. For future ChatGPT/Gemini/Claude imports, `platform` and `conversationId` can point to the original source conversation while the payload remains normalized into SKAI trace + graph.

## macOS Opening Behavior

`.skai` v1 is JSON with a custom extension. Without a registered SKAI app or file association, macOS will not know a special native viewer for it. Users can still open it with a text editor or developer tool because the content is JSON, but double-click behavior is not a good product experience yet.

Recommended demo path:

- keep `.skai` as inspectable JSON for now;
- use the single web viewer/import surface at `/skai/viewer`;
- render manifest, integrity status, trace, and 3D Dual Graph;
- reuse that same viewer in public share pages for `.skai` save/share/PDF;
- later consider a GitHub preview plugin, VS Code extension, or native file association.

## Unified Viewer Principle

SKAI should not create separate viewers for share, import, and PDF. The canonical viewer is `SkaiFileViewer`:

- public share embeds it when a `PublishedAttempt.skaiFile` exists;
- `/skai/viewer` uses it for drag-and-drop file opening;
- `.skai` save/download is handled by the viewer;
- link sharing is handled by the viewer;
- PDF generation uses the same viewer through browser print.

This prevents `.skai` from splintering into multiple UI dialects.

## Analysis Extensions

Judge and coaching outputs are optional derived layers. They must not rewrite `.skai` core.

Current extension keys:

```text
extensions["skai.judge.v1"]
extensions["skai.coach.v1"]
```

Required design rules:

- every extension references the core graph through stable ids such as `pairId`, `nodeId`, `edgeId`, `traceEventId`, or `attemptId`;
- every extension records `inputGraphHash`;
- generated prose is secondary to graph id references, rubric axis, severity, confidence, and next action fields;
- the unified viewer renders extensions through `SkaiExtensionRegistry`;
- deterministic fixture extensions are development baselines, not final LLM judge quality.

The current development loop is:

```text
npm run skai:fixtures
npm run skai:validate
npm run skai:viewer-smoke
npm run judge:fixture
npm run judge:regression
npm run verify:skai
```

Golden fixtures live in `fixtures/skai/`.

Runtime export helpers expose an optional extension hook:

```text
buildSkaiFileArtifact({ ..., extensions })
attachSkaiFileExtensions(artifact, extensions)
```

Use this hook only after deriving extensions from an existing core artifact. The extension should record the core `artifactHash` and `inputGraphHash`; attaching the extension recalculates the final artifact integrity while leaving core section hashes inspectable.

## Future Analysis Extension

LLM judge-dependent or derived reading layers can grow under optional extensions, for example:

```json
{
  "extensions": {
    "skai.judge.v1": {},
    "skai.coach.v1": {},
    "skai.overlay.v1": {},
    "skai.counterfactual.v1": {}
  }
}
```

This keeps `.skai` usable as a lightweight graph backbone even when no judge has run.

## Future Directions

### `.skai` bundle

Eventually `.skai` can become a bundle:

```text
manifest.json
problem.json
trace.json
graph.json
reports/
materials/
signatures/
```

### `.skaig`

Graph-only exchange format for research, graph comparison, and visualization.

### `.skair`

Report/certification-oriented format for education completion, hiring review, or founder review.

### Signatures

Future integrity layers:

- SKAI server signature;
- user signature;
- organization signature;
- certification authority signature;
- verifiable credential bridge.

## Design Constraint

Do not let `.skai` collapse into "AI chat log download." Every viewer, importer, and plugin should treat graph structure as the primary surface and transcript as evidence.
