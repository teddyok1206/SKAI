# SKAI File Fixtures

Golden `.skai` artifacts for judge/coaching development.

Use these files as stable contract inputs:

```bash
npm run skai:fixtures
npm run skai:validate
npm run judge:fixture
npm run judge:regression
```

Rules:

- Core fixtures are source-of-truth trace/graph artifacts.
- `derived/*.judged.skai` files are deterministic baseline outputs for viewer and extension checks.
- Do not hand-edit fixture hashes. Regenerate fixtures through scripts.
- Promote real smoke-test attempts into this folder only when they represent a reusable orchestration pattern.

