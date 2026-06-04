# 073 Judge Coaching Development System

Date: 2026-06-04

## Goal

Establish a programmer-friendly development loop for LLM judge and coaching work without destabilizing `.skai` core, the unified viewer, or deployed share flows.

The target loop is:

```text
.skai fixture -> derived extension -> unified viewer overlay -> regression check -> deploy
```

## Scope

Included:

- Update `AGENT.md` with the `.skai` contract and fixture-driven development rules.
- Create a `fixtures/skai/` area for golden `.skai` artifacts.
- Add `.skai` fixture generation for representative orchestration traces.
- Add `.skai` validation CLI.
- Add judge fixture CLI that derives deterministic judge/coaching extensions from `.skai`.
- Add TypeScript extension contracts for `skai.judge.v1` and `skai.coach.v1`.
- Add a viewer extension registry slot so `.skai` extensions render through the same canonical viewer.
- Add package scripts for the development loop.

Excluded:

- Live LLM judge calls.
- Supabase persistence for judge/coaching extensions.
- Changing `.skai` core schema.
- Server-side PDF generation.
- Native `.skai` file association.

## Assumptions

- `.skai` core remains the stable backbone: problem, attempt trace, graph, branch, source, integrity.
- Judge/coaching results are derived analysis layers and must not mutate core graph structure.
- Extension payloads must refer to stable graph ids such as `nodeId`, `edgeId`, `pairId`, or trace event ids.
- Fixture scripts should run without a dev server or network.

## Affected Files

- `AGENT.md`
- `package.json`
- `lib/types.ts`
- `lib/skai-extensions.ts`
- `components/skai-file-viewer.tsx`
- `components/skai-extension-registry.tsx`
- `scripts/skai_file_common.mjs`
- `scripts/generate_skai_fixtures.mjs`
- `scripts/skai_validate.mjs`
- `scripts/judge_fixture.mjs`
- `fixtures/skai/`
- `docs/technical/015_skai_file_format.md`
- `docs/000_orchestration.md`

## Data Model

Do not change `.skai` core fields.

Use optional extension keys:

```text
extensions["skai.judge.v1"]
extensions["skai.coach.v1"]
```

These extensions are derived views over `payload.graph.child` and `payload.attempt.trace`.

## Implementation Steps

1. Record development system rules in `AGENT.md`.
2. Add extension types and renderer registry.
3. Add CLI common helpers for stable JSON, section hashing, validation, and graph stats.
4. Add fixture generator that writes valid `.skai` files.
5. Add `skai:validate` script.
6. Add deterministic `judge:fixture` and `judge:regression` scripts.
7. Render known extensions inside `SkaiFileViewer` without splitting viewer surfaces.
8. Update docs and plan result.

## Verification

- `npm run skai:fixtures`
- `npm run skai:validate`
- `npm run judge:fixture`
- `npm run judge:regression`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Risks

- Extension rendering could make the viewer feel like a score dashboard. Keep extension cards secondary to core graph.
- Fixture judge output could be mistaken for final LLM judge quality. Mark it deterministic/baseline.
- Too much script abstraction can slow early development. Keep scripts small and inspectable.

## Rollback Notes

- Remove package scripts and scripts under `scripts/skai_*` / `scripts/judge_fixture.mjs`.
- Remove `SkaiFileExtensionRegistry` call from `SkaiFileViewer`.
- Keep `.skai` core untouched.

## Implementation Result

- Added `.skai` contract and fixture-driven judge/coaching rules to `AGENT.md`.
- Added `SkaiJudgeExtensionV1` and `SkaiCoachExtensionV1` types.
- Added `lib/skai-extensions.ts` for known extension keys and type guards.
- Added `components/skai-extension-registry.tsx` and mounted it inside the canonical `SkaiFileViewer`.
- Added fixture scripts:
  - `scripts/skai_file_common.mjs`
  - `scripts/generate_skai_fixtures.mjs`
  - `scripts/skai_validate.mjs`
  - `scripts/judge_fixture.mjs`
- Added package scripts:
  - `skai:fixtures`
  - `skai:validate`
  - `judge:fixture`
  - `judge:regression`
- Added `fixtures/skai/` core fixtures and deterministic derived `.judged.skai` fixtures.
- Updated `.skai` format and orchestration docs.

## Verification Result

- `npm run skai:fixtures`: passed.
- `npm run skai:validate`: passed for core and derived fixtures.
- `npm run judge:fixture`: passed and wrote deterministic `derived/*.judged.skai` artifacts.
- `npm run judge:regression`: passed.

## Open Questions

- When LLM judge is stable, should extension reports be stored in Supabase separately or embedded only at publish/export time?
- What set of golden fixtures best represents the first 10-person smoke test?
