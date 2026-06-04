# SKAI Copy Inventory

Date: 2026-06-05

## Purpose

This inventory classifies current SKAI UI copy before bilingual migration.

The goal is not to translate every string immediately. The goal is to decide which text is:

- a protected SKAI technical token;
- brand/philosophy copy that must be rewritten per language;
- ordinary UI copy that can be translated directly;
- problem/content copy that should be handled later.

## Copy Postures

| Posture | Meaning | Example |
| --- | --- | --- |
| Protected token | Keep English or bilingual form across locales | `Trace`, `Artifact`, `3D Dual Graph` |
| Per-language rewrite | Author separately in Korean and English | Hero/mantra/brand copy |
| Direct translation | Translate normally | Buttons, filters, placeholders |
| Locale-specific content | Keep source content language unless separately localized | Problem statements, materials, prompt playbooks |
| Defer | Do not move yet | API errors, generated problem body text |

## Protected Terms

These terms should not be casually translated:

```text
SKAI
.skai
Orchestration
Prompt
Response
Status
Trace
Artifact
3D Dual Graph
Branch
Replay
Breakpoint
Judge
Coaching
Fixture
Extension
```

Korean mode may explain them in Korean, but should preserve the token where it carries architectural meaning.

## Brand / Philosophy

Priority copy:

| Key | Korean | English | Posture |
| --- | --- | --- | --- |
| `home.hero.line1` | 불꽃은 주어졌습니다. | The fire has been given. | Per-language rewrite |
| `home.hero.line2` | 이제 당신의 장작을 넣을 차례입니다. | Now bring your own fuel. | Per-language rewrite |
| `share.artifact.mantra` | 프롬프트를 외우지 마십시오. 일의 구조를 설계하십시오. | Do not memorize prompts. Design the structure of work. | Per-language rewrite |

Philosophy watchpoint:

- do not make the English copy sound like a literal translation;
- do not make the Korean copy sound like generic AI productivity marketing;
- keep user agency over capability spectacle.

## Navigation / Action

Initial migration candidates:

| Key | Current Surface | Posture |
| --- | --- | --- |
| `nav.problems` | `Problems` | Direct translation |
| `nav.admin` | `Admin` | Protected-ish product surface, translate only if necessary |
| `home.cta.firstProblem` | `첫 문제 풀기` | Direct translation |
| `home.cta.viewProblems` | `문제 보기` | Direct translation |
| `auth.googleSignIn` | `Google 로그인` | Direct translation, keep `Google` |
| `auth.localDemo` | `Local demo` | Direct translation, keep demo token acceptable |

## Problem Browser

Initial migration candidates:

| Key Group | Examples | Posture |
| --- | --- | --- |
| `problemBrowser.category.*` | 업무, 자료조사, 창작, 데이터, 코딩, 전략 | Direct translation |
| `problemBrowser.difficulty.*` | 입문, 표준, 심화 | Direct translation |
| `problemBrowser.material.*` | 자료 없음, 이미지, 스프레드시트 | Direct translation |
| `problemBrowser.curation.*` | Smoke 후보, 처음 체감, 자료 다루기 | Mixed: keep `Smoke`, translate rest |
| `problemBrowser.search.placeholder` | 문제나 자료 검색 | Direct translation |
| `problemBrowser.empty.*` | 조건에 맞는 문제가 없습니다. | Direct translation |

Philosophy watchpoint:

- avoid exposing internal terms like `goalProfile` to beginners;
- problem browser copy should guide scenario choice, not model competition.

## Solve / Chat / Material

Initial posture:

- Defer full migration to slice 080.
- Preserve provider/model names.
- Preserve `Prompt`, `Response`, `Trace`, `Artifact` where they denote graph structure.
- Translate composer/dropzone/help text.
- Problem playbooks are content, not UI. They need separate locale variants later.

High-risk copy:

- hidden/system prompt wording must never leak into user UI;
- model choice copy must not imply a default/recommended model;
- material copy must reinforce evidence control, not file-upload novelty.

## Graph / Viewer

Initial migration candidates:

| Key | Current Surface | Posture |
| --- | --- | --- |
| `skaiViewer.title` | `.skai Viewer` | Keep `.skai`, translate helper only |
| `skaiViewer.openTitle` | `Open a .skai artifact` | Protected token + direct translation |
| `skaiViewer.action.save` | `.skai 저장` | Keep `.skai` |
| `skaiViewer.action.share` | `공유` | Direct translation |
| `skaiViewer.action.pdf` | `PDF` | Keep |
| `skaiViewer.traceEvidence` | `Trace Evidence` | Keep token, optionally explain |
| `skaiViewer.derivedLayers` | `Derived Layers` | Keep/translate as `Derived Layers` with Korean helper |
| `graph.title.3dDual` | `3D Dual Graph` | Protected token |

Philosophy watchpoint:

- the viewer must remain a graph artifact viewer, not a transcript dump;
- `Trace Evidence` should be framed as evidence for structure.

## Share / Public

Initial migration candidates:

| Key | Current Surface | Posture |
| --- | --- | --- |
| `share.skai.oldSnapshot` | old `.skai` fallback copy | Direct translation with `.skai` protected |
| `share.universal.title` | `Universal Reading Layer` | Keep or bilingual |
| `share.skeleton.title` | `Graph Skeleton` | Keep token |
| `share.comment.placeholder` | prompt comment placeholder | Direct translation |

Important distinction:

```text
artifact content language != viewer UI language
```

A Korean attempt can be read through English UI labels without translating the trace itself.

## Judge / Coaching

Initial migration candidates:

| Key Group | Examples | Posture |
| --- | --- | --- |
| `extension.judge.*` | Judge Layer, Total, Generator, Graph Hash | Protected token + direct translation |
| `extension.coach.*` | Coaching Layer, next targets | Protected token + direct translation |
| `scoreReport.*` | Intelligence Mirror, strengths, improvements | Per-language rewrite for coaching tone |

Philosophy watchpoint:

- judge/coaching must not become score grinding;
- feedback should refer back to graph/trace/pair ids where possible;
- Korean/English coach wording may differ, but graph targets must remain identical.

## Error / System

Initial posture:

- Defer most API/server errors.
- Auth notices on the home page can move early.
- Developer-facing errors may stay English.

Examples:

| Key | Current Surface | Posture |
| --- | --- | --- |
| `auth.notice.missingCode` | 로그인 callback에 인증 코드가 없습니다. | Direct translation |
| `auth.notice.notConfigured` | Supabase 환경 변수가 없어... | Direct translation, keep `Supabase` |
| `api.error.invalidJson` | Invalid JSON body. | Defer, developer/system-facing |

## First Registry Cut

The first registry should cover:

1. home hero and actions;
2. nav/auth basics;
3. problem browser filters;
4. `.skai` viewer actions and labels;
5. extension registry labels;
6. share old snapshot fallback;
7. official philosophy mantra.

This is enough to prove the copy-management loop before migrating the entire app.

