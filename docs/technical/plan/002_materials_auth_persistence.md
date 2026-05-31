# 002 Materials Auth Persistence

Date: 2026-06-01

## Goal

Handle the first MVP cautions and add file-aware problem solving:

- Expose Supabase Google login in the UI.
- Add optional Supabase persistence helpers while keeping local demo fallback.
- Add official problem materials.
- Add a material viewer.
- Add user upload and drag-and-drop attachments.
- Include selected/uploaded materials in backend model context.

## Scope

Included:

- Problem material type and seed materials.
- Fixture files for the budget workflow problem.
- Material sidebar/list and viewer.
- Attachment selection for official materials.
- Upload control and drop zone.
- Attachment chips on the composer.
- Attachment context in `/api/chat`.
- OpenAI-compatible image attachment support.
- Supabase auth status component.
- Supabase persistence helper for attempts/published attempts where env vars and user session exist.

Excluded:

- Production OCR.
- Arbitrary XLSX/PDF parsing.
- Full Supabase RLS policy hardening.
- Server-side durable file storage.
- Certification-grade file provenance.

## Implementation Steps

1. Update documentation and decision register.
2. Extend domain types with `ProblemMaterial` and `AttemptAttachment`.
3. Add sample budget materials with extracted text.
4. Generate fixture files under `public/materials/`.
5. Add material viewer UI.
6. Add upload/dropzone UI.
7. Add attachment context to trace events and chat requests.
8. Update mock and OpenAI-compatible providers to consume attachments.
9. Add Supabase auth status component.
10. Add optional Supabase persistence helpers.
11. Update migration with material/attachment-friendly fields.
12. Verify audit, typecheck, lint, build, and API smoke.

## Verification

- App loads.
- Budget problem shows materials.
- A material can be opened.
- A material can be attached to a prompt.
- A text file can be uploaded and sent.
- `/api/chat` receives attachment context.
- Auth UI shows local mode when Supabase env vars are absent.
- Existing mock flow still works.

## Implementation Status

Status: implemented as MVP pass.

Completed so far:

- Requirement archived and documented.
- Decision register updated.
- Domain model extended with `ProblemMaterial` and `AttemptAttachment`.
- Budget problem seed materials added.
- Fixture generation script added.
- PNG/XLSX/CSV demo fixture files generated.
- Attachment context helper added.
- Mock provider consumes attachment context.
- OpenAI-compatible provider can include text attachment context and image data URL parts.
- Chat/judge API schemas accept attachments.
- Supabase auth status component added.
- Optional Supabase persistence helpers added.
- Material viewer added to the solve page.
- Official materials can be selected for the next prompt.
- Upload/dropzone added to the composer.
- Trace events store attached files.
- Share view displays attachments.
- Supabase migration includes `materials`, `attachments`, and published attempt `snapshot`.

Verification completed:

- `conda run -n SKAI npm audit --audit-level=moderate`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `POST /api/chat` with attachment context
- `GET /materials/club-budget/receipt-001.png`

## Risks

- Browser-only uploads are not durable.
- Vision support depends on selected provider/model.
- Official XLSX fixture uses extracted text sidecar until spreadsheet parsing is added.
- Supabase persistence can only be fully tested with real project credentials.
