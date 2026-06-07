# 071 SKAI File Format And Public Share Snapshot

Date: 2026-06-04

## Goal

Implement the first real `.skai` file format and use it to make public share pages more durable.

The point is not only "download this attempt." The point is to define a lightweight, integrity-preserving artifact format for sharing AI orchestration history:

```text
intent + materials -> orchestration trace -> graph state -> judge/report -> shareable artifact
```

## Philosophy

`.skai` must not become a generic chat transcript export.

It should encode:

- the user's prompt/response trace as a first-class artifact;
- the 3D Dual Graph derived from that trace;
- graph annotations, overlay signals, and skeleton reading layers;
- score/judge reports as analysis attached to the trace;
- branch replay comparison when available;
- integrity hashes so the artifact can later become portfolio, review, or certification evidence.

The file should be readable and debuggable today, but extensible enough for future plugin, CLI, GitHub, and viewer workflows.

## Scope

Included in core v1:

- `.skai` extension using JSON canonical payload;
- explicit schema version and MIME type;
- section-level SHA-256 integrity hashes;
- artifact-level SHA-256 hash;
- child attempt graph snapshot;
- optional parent graph snapshot for branch replay share;
- optional structural branch snapshot;
- public share page download button;
- publish-time generation so remote share snapshots can carry graph comparison state.

Excluded from v1:

- LLM judge-dependent fields;
- score report;
- graph overlay index;
- graph skeleton;
- universal summary;
- visual artifact summary;
- counterfactual judge report;
- graph state transition analysis;
- zipped bundle with binary materials;
- cryptographic signing;
- import UI;
- full certification/anti-cheat signature chain;
- object storage for original uploaded files;
- backward-compatible migration for every old local published attempt.

## Format Direction

Use `.skai` as the canonical extension from the beginning.

For v1, `.skai` is a single JSON document:

```text
attempt-title.skai
Content-Type: application/vnd.skai+json
```

This keeps the first format:

- lightweight;
- inspectable in a text editor;
- easy to commit to GitHub;
- easy to validate with a browser or CLI;
- easy to wrap into a future zipped bundle without changing the conceptual schema.

Future variants can remain open:

- `.skaig`: graph-only lightweight exchange;
- `.skair`: report/certification-focused artifact;
- `.skai`: full bundle, eventually zip-like with `manifest.json`, `graph.json`, `trace.json`, `materials/`, `reports/`, `signatures/`.

## Data Model

Add `SkaiFileArtifact`:

```ts
interface SkaiFileArtifact {
  format: "SKAI";
  schemaVersion: "skai.file.v1";
  mimeType: "application/vnd.skai+json";
  extension: ".skai";
  createdAt: string;
  manifest: SkaiFileManifest;
  payload: SkaiFilePayload;
  integrity: SkaiFileIntegrity;
}
```

The payload should have stable sections:

- `problem`;
- `attempt`;
- `graph`;
- `branch`.

Each section gets a SHA-256 hash. The final artifact hash is computed over the canonical artifact without the final `integrity` block plus section hashes.

Judge-dependent analysis should later be attached as optional extension payload, not as core backbone:

```text
extensions.analysis.scoreReport
extensions.analysis.overlay
extensions.analysis.skeleton
extensions.analysis.counterfactualJudge
```

Source provenance is core because it is not judge-dependent:

```text
manifest.source.platform
manifest.source.conversationId
manifest.source.primaryProvider
manifest.source.primaryModel
```

For SKAI-native attempts, `conversationId` is the attempt id.

## Public Share Strategy

At publish time:

1. Build the public child trace.
2. Build the child `ConversationGraph`.
3. If the attempt is a branch and the parent attempt is available locally, build the parent graph too.
4. Build the `.skai` artifact.
5. Store it inside `PublishedAttempt.skaiFile`.
6. Sync the published snapshot to Supabase.

Important: `.skai` graph snapshots must be structural. The builder should accept the graph produced by the app, then project only the allowed structural subset. It should strip annotations and judge-dependent status signals instead of creating an independent graph-building path.

At share render time:

1. Load `PublishedAttempt` from local/Supabase.
2. If current `PublishedAttempt.scoreReport` exists, use it as a rich in-app analysis extension; otherwise render the core graph/share view without a score report.
3. If `parent` graph and `parentTrace` exist in `.skai`, show structural parent/child `GraphComparisonView`.
4. Fall back to rebuilding from trace and `GraphStateTransitionView` for old snapshots.

## Implementation Steps

1. Add `.skai` types to `lib/types.ts`.
2. Add `lib/skai-format.ts`:
   - canonical stable stringify;
   - SHA-256 hash helper;
   - trace/attachment sanitizer;
   - material manifest builder;
   - `buildSkaiFileArtifact`;
   - `verifySkaiFileArtifact`;
   - safe filename helper.
3. Update `publishAttempt` to generate and attach `skaiFile`.
4. Update `/api/published/sync` schema so `skaiFile` is not stripped.
5. Add `/api/published/[attemptId]/skai` for remote `.skai` download when Supabase can serve the published snapshot.
6. Update share page:
   - download `.skai`;
   - show artifact hash and schema version;
   - use stored child graph snapshot when present;
   - use stored parent graph snapshot for branch graph comparison.
7. Add `docs/technical/015_skai_file_format.md`.
8. Update `docs/000_orchestration.md`.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

Manual smoke:

- publish a normal judged attempt;
- open share page;
- download `.skai`;
- inspect JSON schema version/hash fields;
- publish a branch attempt with parent available;
- open share page directly;
- confirm parent/child graph comparison uses stored `.skai` graph snapshots.

## Implementation Result

- Added `SkaiFileArtifact` and related `.skai` schema types.
- Added `lib/skai-format.ts`:
  - stable JSON canonicalization;
  - SHA-256 section hashing;
  - artifact-level hash;
  - attachment binary stripping;
  - public trace sanitization;
  - child/parent graph snapshot construction;
  - verification helper.
- Publish flow now generates `PublishedAttempt.skaiFile` before local/Supabase sync.
- `/api/published/sync` now preserves `skaiFile` instead of stripping it.
- Added `/api/published/[attemptId]/skai` for remote `.skai` download.
- Share page now:
  - uses stored `.skai` parent graph snapshot for branch comparison when available;
  - falls back to rebuilt graph / `GraphStateTransitionView` for old snapshots;
  - downloads `.skai` from the browser;
  - shows schema version and artifact hash prefix.
- Added `docs/technical/015_skai_file_format.md`.
- Updated `docs/000_orchestration.md`.

## Simplification Pass Result

- Removed score report, visual artifact, universal summary, skeleton, overlay index, graph transition, and counterfactual report from the `.skai` core payload.
- Reframed those fields as future optional analysis extensions.
- Changed `.skai` graph handling to parse the app-provided graph into a structural subset, stripping annotations and judge-dependent status signals.
- Kept share page's rich UI free to use optional `PublishedAttempt.scoreReport`, while `.skai` remains the lightweight portable backbone and unjudged exports remain valid.
- Added source provenance to manifest: `platform`, `conversationId`, `exportedFrom`, and optional primary provider/model.
- Documented that macOS can open `.skai` as JSON only through a chosen text/developer app until SKAI provides a viewer or file association.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Risks

- A JSON `.skai` file can still become large if raw traces are long.
- If uploaded binary data URLs remain in trace attachments, the artifact becomes heavy and privacy-sensitive.
- Section hashes can create false confidence if users do not understand that v1 is unsigned.
- Adding graph snapshots to published attempts can approach the 2MB published snapshot guardrail.

## Guardrails

- Strip `contextDebug`.
- Strip attachment `dataUrl` from `.skai` v1.
- Keep text content and material extracted text only where already intentionally included in the public attempt.
- Treat v1 integrity as tamper evidence, not identity proof.
- Keep raw trace below graph/report layers in the share UI.

## Rollback

- Remove `skaiFile` from publish payload and share UI.
- Public share can still rebuild graph from trace.
- Existing published snapshots remain readable because `skaiFile` is optional.

## Philosophy Check

This plan strengthens SKAI's core direction by making orchestration history portable as a graph artifact, not merely a transcript or score report. The main watchpoint is avoiding a premature certification claim: `.skai v1` can prove structural consistency through hashes, but it cannot yet prove authorship or institutional validity.
