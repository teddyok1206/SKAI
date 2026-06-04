import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function canonicalize(value) {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item) ?? null);
  }

  if (typeof value === "object") {
    const output = {};

    for (const key of Object.keys(value).sort()) {
      const nextValue = canonicalize(value[key]);

      if (nextValue !== undefined) {
        output[key] = nextValue;
      }
    }

    return output;
  }

  return String(value);
}

export function stableStringify(value, space) {
  return JSON.stringify(canonicalize(value), null, space);
}

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${stableStringify(value, 2)}\n`);
}

export function coreSections(artifact) {
  return {
    manifest: artifact.manifest,
    problem: artifact.payload?.problem,
    attempt: artifact.payload?.attempt,
    graph: artifact.payload?.graph,
    branch: artifact.payload?.branch,
  };
}

export function hashSections(sections) {
  const sectionHashes = {};

  for (const [key, value] of Object.entries(sections)) {
    if (value !== undefined) {
      sectionHashes[key] = sha256Hex(stableStringify(value));
    }
  }

  return sectionHashes;
}

export function buildIntegrity(artifactWithoutIntegrity) {
  const sectionHashes = hashSections(coreSections(artifactWithoutIntegrity));
  const artifactHash = sha256Hex(stableStringify({ ...artifactWithoutIntegrity, sectionHashes }));

  return {
    algorithm: "sha256",
    canonicalization: "stable-json-v1",
    sectionHashes,
    artifactHash,
  };
}

export function attachIntegrity(artifactWithoutIntegrity) {
  return {
    ...artifactWithoutIntegrity,
    integrity: buildIntegrity(artifactWithoutIntegrity),
  };
}

function withoutIntegrity(artifact) {
  const artifactWithoutIntegrity = { ...artifact };
  delete artifactWithoutIntegrity.integrity;
  return artifactWithoutIntegrity;
}

export function recalculateIntegrity(artifact) {
  return attachIntegrity(withoutIntegrity(artifact));
}

export function verifySkaiArtifact(artifact) {
  const artifactWithoutIntegrity = withoutIntegrity(artifact);
  const expectedIntegrity = buildIntegrity(artifactWithoutIntegrity);
  const sectionChecks = Object.fromEntries(
    Object.entries(expectedIntegrity.sectionHashes).map(([key, hash]) => [key, artifact.integrity?.sectionHashes?.[key] === hash]),
  );
  const errors = [];

  if (artifact.format !== "SKAI") errors.push("format must be SKAI");
  if (artifact.schemaVersion !== "skai.file.v1") errors.push("schemaVersion must be skai.file.v1");
  if (artifact.mimeType !== "application/vnd.skai+json") errors.push("mimeType must be application/vnd.skai+json");
  if (artifact.extension !== ".skai") errors.push("extension must be .skai");
  if (artifact.integrity?.algorithm !== "sha256") errors.push("integrity.algorithm must be sha256");
  if (artifact.integrity?.canonicalization !== "stable-json-v1") errors.push("integrity.canonicalization must be stable-json-v1");
  if (artifact.integrity?.artifactHash !== expectedIntegrity.artifactHash) errors.push("artifactHash mismatch");

  for (const [section, ok] of Object.entries(sectionChecks)) {
    if (!ok) {
      errors.push(`section hash mismatch: ${section}`);
    }
  }

  errors.push(...validateGraphShape(artifact.payload?.graph?.child));

  return {
    ok: errors.length === 0,
    errors,
    expectedArtifactHash: expectedIntegrity.artifactHash,
    actualArtifactHash: artifact.integrity?.artifactHash,
    sectionChecks,
  };
}

function validateGraphShape(graph) {
  if (!graph) {
    return ["payload.graph.child is required"];
  }

  const errors = [];
  const nodeIds = new Set([
    ...(graph.promptNodes ?? []).map((node) => node.id),
    ...(graph.responseNodes ?? []).map((node) => node.id),
    ...(graph.statusNodes ?? []).map((node) => node.id),
  ]);
  const pairIds = new Set((graph.pairs ?? []).map((pair) => pair.id));

  for (const pair of graph.pairs ?? []) {
    if (!nodeIds.has(pair.promptNodeId)) errors.push(`pair ${pair.id} has missing prompt node`);
    if (pair.responseNodeId && !nodeIds.has(pair.responseNodeId)) errors.push(`pair ${pair.id} has missing response node`);
    if (!nodeIds.has(pair.statusNodeId)) errors.push(`pair ${pair.id} has missing status node`);
  }

  for (const edge of [...(graph.promptEdges ?? []), ...(graph.responseEdges ?? []), ...(graph.statusEdges ?? [])]) {
    if (!nodeIds.has(edge.sourceNodeId)) errors.push(`edge ${edge.id} has missing source node`);
    if (!nodeIds.has(edge.targetNodeId)) errors.push(`edge ${edge.id} has missing target node`);
    if (edge.pairId && !pairIds.has(edge.pairId)) errors.push(`edge ${edge.id} has missing pair`);
  }

  return errors;
}

export function graphStats(graph) {
  return {
    prompts: graph?.promptNodes?.filter((node) => !node.synthetic).length ?? 0,
    responses: graph?.responseNodes?.filter((node) => !node.synthetic).length ?? 0,
    statusNodes: graph?.statusNodes?.length ?? 0,
    pairs: graph?.pairs?.length ?? 0,
    edges: (graph?.promptEdges?.length ?? 0) + (graph?.responseEdges?.length ?? 0) + (graph?.statusEdges?.length ?? 0),
  };
}

export async function listSkaiFiles(inputPath) {
  const absolutePath = path.resolve(inputPath);
  const files = [];

  async function walk(currentPath) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".skai")) {
        files.push(entryPath);
      }
    }
  }

  if (absolutePath.endsWith(".skai")) {
    return [absolutePath];
  }

  await walk(absolutePath);
  return files.sort();
}

export function inputGraphHash(artifact) {
  return artifact.integrity?.sectionHashes?.graph ?? sha256Hex(stableStringify(artifact.payload?.graph));
}
