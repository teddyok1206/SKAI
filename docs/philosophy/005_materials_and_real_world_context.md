# Materials And Real-World Context

Date: 2026-06-01

Source archive: `ARCHIVE_prompt_long/005.md`

## Core Principle

SKAI problems should not only evaluate how users write prompts against a clean text statement. Real-world AI work often depends on using messy surrounding materials: receipts, spreadsheets, screenshots, logs, PDFs, notes, forms, and partially structured records.

Therefore, SKAI must evaluate whether users can:

- Notice which materials matter.
- Inspect materials before delegating work to AI.
- Select the right files for the right sub-task.
- Explain the role of each material in the workflow.
- Avoid over-trusting noisy files.
- Separate what the file proves from what still needs human/domain judgment.
- Ask AI to use files with clear extraction, transformation, and verification instructions.

## Product Implication

Problem materials are first-class problem context. They are not decorative attachments.

Each problem can include an official material set. Users can also upload their own files during an attempt.

The UI should support:

- A visible material list next to the problem.
- Opening materials in a viewer or tab-like panel.
- Selecting official materials to include in a prompt.
- Uploading files through a `+` action or drag and drop.
- Showing which files are attached to the next model call.

## Evaluation Implication

The judge should eventually score material use.

Possible scoring signals:

- Did the user inspect relevant files before asking for conclusions?
- Did the user attach the correct files for the current sub-task?
- Did the user ask the model to extract structured facts from files?
- Did the user distinguish file evidence from assumptions?
- Did the user verify spreadsheet/image-derived claims?
- Did the user avoid leaking or overusing irrelevant files?

## Demo Direction

The first implementation can normalize problem-provided materials into model-readable extracted text while preserving visible file previews. Uploaded text-like files can be read directly. Uploaded images can be passed as image data to vision-capable providers where supported, while mock mode records the attachment metadata.

