# 075 Language System Track

Date: 2026-06-04

## Goal

Build SKAI's bilingual Korean/English language system as a multi-slice track, not as a one-off translation pass.

The system must support this real development workflow:

```text
developer/founder edits one language
-> copy key is marked changed
-> opposite language is auto-flagged stale or generated as draft
-> reviewer/founder approves
-> app renders by locale
-> regression checks missing/stale/protected terms
```

The goal is to avoid duplicate manual work while preserving SKAI's philosophical precision.

## Core Principle

SKAI should not maintain two disconnected text files.

Instead, SKAI should maintain one canonical copy registry where each user-facing string has:

- stable key;
- domain/category;
- source locale;
- Korean text;
- English text;
- protected terms;
- status for each locale;
- source checksum;
- last updated metadata.

This mirrors the way mature multilingual products separate product copy from code and use translation-management workflow concepts, but SKAI should implement the smallest useful version first.

## Language Doctrine

### Preserve Technical Concepts

In Korean mode, keep these as English or bilingual technical tokens:

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

Use Korean explanations around them.

Example:

```text
Trace는 사용자의 문제 접근이 시간순으로 남은 구조적 증거입니다.
```

### Rewrite Philosophy, Do Not Literal-Translate

Brand/philosophy copy should be authored per language.

Korean:

```text
불꽃은 주어졌습니다.
이제 당신의 장작을 넣을 차례입니다.
```

English:

```text
The fire has been given.
Now bring your own fuel.
```

### Avoid Bad Compression

Do not translate:

- `Orchestration` as merely `지시`;
- `Artifact` as merely `결과`;
- `Trace` as merely `기록`;
- `Judge` as merely `채점`;
- `Coaching` as merely `조언`.

If Korean clarity is needed, use bilingual forms:

```text
Orchestration 구조
Artifact 산출물
Trace evidence
Judge layer
Coaching layer
```

## Smart Copy Workflow

### Problem

During development, copy often changes like this:

- founder says, "Korean hero copy should change from A to B";
- developer adds English button text first;
- new judge/coaching message is written in Korean first;
- `.skai` viewer label is written in English first.

If `ko.ts` and `en.ts` are independently edited, the opposite language will drift.

### Solution

Use a copy registry model:

```ts
type Locale = "ko" | "en";
type CopyStatus = "approved" | "draft" | "stale" | "missing";

interface CopyEntry {
  key: string;
  domain: CopyDomain;
  sourceLocale: Locale;
  protectedTerms: string[];
  values: {
    ko?: string;
    en?: string;
  };
  status: {
    ko: CopyStatus;
    en: CopyStatus;
  };
  sourceChecksum: string;
  updatedAt: string;
  notes?: string;
}
```

When one side changes:

1. update the changed locale;
2. recompute source checksum;
3. mark the opposite locale as `stale` if it previously existed;
4. mark the opposite locale as `missing` if it did not exist;
5. optionally generate a draft translation with an LLM helper, but never auto-approve it;
6. `verify:i18n` fails only for missing required production strings, and warns for stale draft strings during early demo.

## Slice Plan

### 075. Language Doctrine And Smart Copy Plan

Status: this document.

Deliverables:

- language doctrine;
- protected terms;
- smart copy workflow;
- full slice roadmap.

### 076. Copy Inventory

Status: completed.

Goal: collect current UI copy and classify it before moving strings.

Deliverables:

- `docs/design/004_copy_inventory.md`;
- inventory categories:
  - brand/philosophy;
  - navigation/action;
  - problem browser;
  - solve/chat/material;
  - graph/viewer;
  - share/public;
  - judge/coaching;
  - error/system;
- mark each item as:
  - keep English token;
  - translate;
  - rewrite per language;
  - defer.

### 077. I18n Registry Foundation

Status: completed.

Goal: implement the smallest copy registry.

Files:

```text
lib/i18n/types.ts
lib/i18n/protected-terms.ts
lib/i18n/registry.ts
lib/i18n/index.ts
components/language-toggle.tsx
```

Rules:

- default locale: `ko`;
- no automatic browser-locale switching in demo;
- user explicitly chooses `ko` or `en`;
- selection stored in `localStorage`;
- no URL locale routing yet.

### 078. Copy Sync Tooling

Status: completed.

Goal: make one-sided edits safe.

Scripts:

```text
scripts/i18n_inventory.mjs
scripts/i18n_update_entry.mjs
scripts/i18n_check.mjs
scripts/i18n_draft_translate.mjs
```

Commands:

```text
npm run i18n:inventory
npm run i18n:check
npm run i18n:update -- --key home.hero.title --locale ko --value "..."
npm run i18n:draft -- --key home.hero.title --target en
```

Behavior:

- changing one locale marks the other locale stale;
- draft translation can be generated but not approved automatically;
- protected terms are checked;
- missing key detection is deterministic.

### 079. Topbar / Home / Problem Browser Localization

Status: completed.

Goal: localize the first impression layer.

Scope:

- topbar;
- home hero;
- problem browser;
- problem metadata labels;
- model/mode selection copy.
- topbar auth/theme/accessibility labels.

Priority official copy:

```text
ko:
불꽃은 주어졌습니다.
이제 당신의 장작을 넣을 차례입니다.

en:
The fire has been given.
Now bring your own fuel.
```

Result:

- `TopbarNav`, `HomeHero`, `AuthNotice`, `AuthStatus`, `ThemeSelector`, and `ProblemBrowser` now consume the copy registry for first-impression UI.
- `LanguageToggle` is mounted in the topbar and stores explicit locale preference in `localStorage`.
- Problem content localization remains intentionally deferred to slice 084.

### 080. Solve Flow Localization

Goal: localize the user-facing solving loop.

Scope:

- problem setup;
- model selection;
- composer;
- material panel;
- attachment/dropzone;
- submit/publish/share notices.

Rules:

- provider/model names are never translated;
- `Prompt`, `Response`, `Trace`, `Artifact` can stay as tokens with Korean explanation.

### 081. Graph And `.skai` Viewer Localization

Goal: localize SKAI's core graph/file surfaces.

Scope:

- `SkaiFileViewer`;
- `SkaiExtensionRegistry`;
- `ConversationGraphView`;
- graph overlay labels;
- `.skai` file actions.

Rules:

- node tokens `P/R/S` stay fixed;
- `Prompt/Response/Status` may remain English in Korean mode;
- explanatory helper text follows selected locale;
- PDF output follows selected viewer UI locale.

### 082. Public Share Localization

Goal: make public share pages bilingual without changing the shared artifact.

Important distinction:

```text
artifact content language != viewer UI language
```

An attempt written in Korean may be viewed with English UI labels.

Scope:

- share artifact card;
- universal reading layer;
- graph skeleton;
- raw transcript labels;
- old snapshot fallback;
- comments UI.

### 083. Judge / Coaching Language Layer

Goal: make learning feedback locale-aware.

Rules:

- judge/coaching extensions should record locale metadata;
- same graph can have both Korean and English coaching layers;
- core `.skai` remains language-neutral except trace/source content;
- LLM judge prompt language must be explicit.

Potential extension metadata:

```json
{
  "schemaVersion": "skai.coach.v1",
  "locale": "ko",
  "sourceLocale": "ko",
  "translationStatus": "approved"
}
```

### 084. Problem Content Localization

Goal: localize problem statements separately from UI.

Potential structure:

```ts
title: {
  ko: "...",
  en: "..."
}
```

Rules:

- original materials may remain in source language;
- translated material text is a derived material, not the original;
- playbooks need locale-aware prompt variants.

### 085. `.skai` Locale Metadata

Goal: let exported/shared files declare language context.

Potential manifest fields:

```json
{
  "locale": "ko",
  "availableLocales": ["ko", "en"]
}
```

Rules:

- graph ids stay language-neutral;
- trace raw text stays original;
- viewer labels are selected by viewer locale;
- generated coaching extensions may be locale-specific.

### 086. I18n Regression

Goal: keep the system from drifting.

Commands:

```text
npm run verify:i18n
```

Checks:

- missing required translation;
- stale opposite-locale entries;
- protected terms changed or translated incorrectly;
- unused keys;
- hardcoded user-facing strings in selected component folders;
- philosophy copy matches approved ko/en official forms.

Later:

```text
npm run verify:skai
npm run verify:i18n
npm run build
```

can become the standard pre-push check.

## Operating Rule

When adding or changing user-facing text after slice 077:

1. create/update a copy registry entry;
2. set the changed locale as `approved` or `draft`;
3. mark the opposite locale `stale` or `missing`;
4. do not hand-edit only one locale dictionary without registry metadata;
5. preserve protected SKAI terms;
6. run `verify:i18n`.

## Rollback

The initial slices should not require URL routing, database migrations, or changing `.skai` core. If the system becomes too heavy, keep only:

- protected terms;
- registry;
- language toggle;
- missing/stale checker.
