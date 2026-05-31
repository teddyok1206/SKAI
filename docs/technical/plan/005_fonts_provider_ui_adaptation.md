# 005 Fonts Provider UI Adaptation

Date: 2026-06-01

## Goal

Apply the recommended SKAI font system and add provider-aware chat surface styling.

## Scope

Included:

- Install Pretendard Variable and JetBrains Mono font packages.
- Use Pretendard for UI text.
- Use JetBrains Mono for evidence/material/code-like surfaces.
- Add provider UI profiles.
- Change the chat surface accent and metadata when the selected model provider changes.
- Add Gemini to the visible provider list and wire it through the OpenAI-compatible provider adapter.
- Keep provider-inspired styling abstract and original, not copied from any provider's product UI.

Excluded:

- Exact replication of ChatGPT, Gemini, Grok, Groq, or OpenRouter UI.
- Provider logos or trademarked visual systems.
- Full chat layout rewrite.

## Design Rule

Provider styling can express high-level interaction mood:

- OpenAI: minimal, neutral, quiet.
- Gemini: airy, research-oriented, blue information accent.
- xAI Grok: high-contrast, direct, amber signal accent.
- Groq: fast inference, compact red/velocity accent.
- OpenRouter: routing/network metaphor, cobalt accent.
- Mock: SKAI workbench default.

It must not copy exact layout, logo treatment, proprietary color compositions, animations, or product trade dress.

## Verification

- Theme/provider combinations remain legible.
- Pretendard Variable and JetBrains Mono load through app imports.
- Gemini uses the OpenAI-compatible endpoint documented by Google AI for Developers.
- `npm audit --audit-level=moderate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
