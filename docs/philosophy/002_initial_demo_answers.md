# Initial Demo Answers

Date: 2026-06-01

Source archive: `ARCHIVE_prompt_long/002.md`

## Answered Direction

1. The first demo should use an in-app AI conversation flow, not only external trace upload.
2. The first user group is university students, but the demo must not become university-specific.
3. The expected test group is fewer than 10 people using personal laptops, with no strict time limit.
4. The first problem does not have to be a workplace task. A narrow business-domain demo may distort the platform direction.
5. Login is acceptable and a backend is preferred if it helps the product.
6. Model calls will initially use the founder's API/account resources. A low-cost provider is preferred. The exact provider is still open.
7. Scoring should include both a total score and multi-axis scores.
8. Full prompt traces should be stored for the demo.
9. Prompt sharing should be included. The default view should show the abstraction, structure, task decomposition, and prompt flow. Full raw prompts and model responses should be expandable on demand.
10. The founder will qualitatively validate whether the smoke demo preserves the core philosophy from `ARCHIVE_prompt_long/001.md`.

## Product Implications

- The demo is not just a trace analyzer. It must feel like solving a SKAI problem with AI inside the product.
- The first content should be domain-general enough to evaluate orchestration, not domain memorization.
- The system needs a trace viewer from the beginning.
- The system needs at least a minimal backend if login, storage, and model calls are included.
- Public sharing is part of the product thesis, not a later cosmetic feature.
- The first judge result does not need to be statistically proven, but it must be philosophically aligned and useful enough for founder review.

## Cautions

- "문제풀이에는 개인정보가 들어갈 이유가 없다" is directionally true for controlled SKAI problems, but the product still needs explicit warnings and later redaction because users can paste unexpected personal or company data.
- The demo should separate raw private trace, public summary trace, and expanded raw public trace.
- Model/provider choice should not be locked before checking current pricing, quotas, and API limits.

