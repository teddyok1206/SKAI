import type { AttemptAttachment, ProblemMaterial } from "@/lib/types";

export function attachmentFromMaterial(material: ProblemMaterial): AttemptAttachment {
  return {
    id: crypto.randomUUID(),
    name: material.fileName,
    mimeType: material.mimeType,
    size: material.extractedText.length,
    source: "problem_material",
    materialId: material.id,
    textContent: material.extractedText,
    createdAt: new Date().toISOString(),
  };
}

export function buildAttachmentContext(attachments: AttemptAttachment[] = []) {
  if (attachments.length === 0) {
    return "";
  }

  return attachments
    .map((attachment, index) => {
      const body =
        attachment.textContent?.trim() ||
        (attachment.dataUrl ? `[image data attached: ${attachment.mimeType}]` : "[binary file metadata only]");

      return [
        `Attachment ${index + 1}: ${attachment.name}`,
        `MIME: ${attachment.mimeType}`,
        `Source: ${attachment.source}`,
        "Content:",
        body,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

export function isTextLikeFile(file: File) {
  return (
    file.type.startsWith("text/") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".txt")
  );
}

export async function attachmentFromFile(file: File): Promise<AttemptAttachment> {
  const base = {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    source: "upload" as const,
    createdAt: new Date().toISOString(),
  };

  if (isTextLikeFile(file)) {
    return {
      ...base,
      textContent: await file.text(),
    };
  }

  if (file.type.startsWith("image/")) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    return {
      ...base,
      dataUrl,
      textContent: `[Uploaded image: ${file.name}. Vision-capable providers can inspect the image data. In text-only mode, ask the user to extract or describe the image.]`,
    };
  }

  return {
    ...base,
    textContent: `[Uploaded binary file: ${file.name}, ${file.type || "unknown MIME"}, ${file.size} bytes. Parser not yet available in MVP.]`,
  };
}

