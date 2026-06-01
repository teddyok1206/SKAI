# Materials And Attachments Architecture

Date: 2026-06-01

## Goal

Make files and reference materials part of the SKAI solving loop so users can practice real-world AI orchestration with messy context.

## Concepts

- `ProblemMaterial`: official material attached to a problem by the author.
- `AttemptAttachment`: material selected or uploaded by the user during a specific attempt.
- `MaterialContext`: normalized text/image context that can be sent to a model.

## MVP Behavior

Problem materials:

- Are shown in the problem sidebar.
- Can be opened in a viewer.
- Can be selected for use in the next prompt.
- Can be dragged into the composer dropzone as a visible next-prompt attachment.
- Include extracted text so the backend can send the relevant content to mock and text-only providers.

User uploads:

- Support drag and drop.
- Support selecting files from disk.
- Text-like files are read into text context.
- Image files are stored as data URLs and can be passed to vision-capable OpenAI-compatible providers.
- Binary spreadsheets/PDFs initially keep metadata unless a parser/extractor is added.

Model calls:

- Include selected problem material extracted text.
- Include uploaded text file content.
- Include uploaded image data for providers/models that accept image input.
- Fall back to attachment summaries when a provider cannot consume a file directly.

## Required Data Fields

`ProblemMaterial`:

- `id`
- `title`
- `description`
- `kind`
- `fileName`
- `mimeType`
- `href`
- `extractedText`

`AttemptAttachment`:

- `id`
- `name`
- `mimeType`
- `size`
- `source`
- `materialId`
- `textContent`
- `dataUrl`

## Evaluation Direction

Add material-use scoring later. It should evaluate:

- Relevance of selected files.
- Whether the user inspected files before using them.
- Whether instructions referenced the attached files correctly.
- Whether extracted facts were verified.
- Whether the user separated evidence from assumptions.

## Graph Relationship

Material attachments should be represented in the derived conversation graph.

MVP behavior:

- Materials are metadata on prompt nodes through `AttemptAttachment[]`.
- Prompt-response pairs with attachments receive `material_used` task status unless a higher-priority status such as `bottleneck` or `verification` applies.

Future behavior:

- Official materials can become first-class graph nodes.
- Edges can connect material nodes to prompt nodes that used them.
- Judge reports can evaluate whether a material edge was relevant, missing, or misused.

## Current Limitation

The MVP uses extracted text sidecars for official problem files. Full production-grade parsing for arbitrary PDFs, spreadsheets, and OCR is deferred.
