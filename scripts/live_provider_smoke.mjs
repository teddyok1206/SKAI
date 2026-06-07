#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const providerPriority = ["gemini", "groq", "xai", "openrouter", "openai"];
const providerEnvKeys = {
  openai: "OPENAI_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};
const providerModels = {
  openai: "gpt-4.1-mini",
  groq: "llama-3.3-70b-versatile",
  xai: "grok-4-fast",
  gemini: "gemini-2.5-flash-lite",
  openrouter: "openai/gpt-oss-20b",
  mock: "mock-orchestrator",
};

function parseArgs(argv) {
  const args = {
    baseUrl: "http://127.0.0.1:3000",
    provider: "auto",
    model: "",
    problemId: "ambiguous-research-brief",
    playbook: "docs/problem_playbooks/ambiguous-research-brief.md",
    write: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if (item === "--base-url" && next) {
      args.baseUrl = next;
      index += 1;
    } else if (item === "--provider" && next) {
      args.provider = next;
      index += 1;
    } else if (item === "--model" && next) {
      args.model = next;
      index += 1;
    } else if (item === "--problem" && next) {
      args.problemId = next;
      index += 1;
    } else if (item === "--playbook" && next) {
      args.playbook = next;
      index += 1;
    } else if (item === "--no-write") {
      args.write = false;
    } else if (item === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`SKAI live provider smoke

Usage:
  npm run smoke:live
  npm run smoke:live -- --provider gemini
  npm run smoke:live -- --base-url http://127.0.0.1:3000 --provider groq

Options:
  --base-url   Local SKAI server URL. Default: http://127.0.0.1:3000
  --provider   auto | gemini | groq | xai | openrouter | openai | mock
  --model      Override model name
  --problem    Problem id. Default: ambiguous-research-brief
  --playbook   Markdown playbook path
  --no-write   Print only, do not write report files
`);
}

async function readEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return Object.fromEntries(
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const separatorIndex = line.indexOf("=");
          const key = line.slice(0, separatorIndex).trim();
          const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
          return [key, value];
        }),
    );
  } catch {
    return {};
  }
}

async function loadEnv() {
  const localEnv = await readEnvFile(path.join(process.cwd(), ".env.local"));
  const env = { ...localEnv, ...process.env };

  return {
    env,
    availability: Object.fromEntries(
      Object.entries(providerEnvKeys).map(([provider, key]) => [provider, Boolean(env[key])]),
    ),
  };
}

function selectProvider(requestedProvider, availability) {
  if (requestedProvider && requestedProvider !== "auto") {
    return requestedProvider;
  }

  return providerPriority.find((provider) => availability[provider]) ?? "mock";
}

async function extractTurnOnePrompt(playbookPath) {
  const content = await readFile(path.join(process.cwd(), playbookPath), "utf8");
  const turnOneIndex = content.indexOf("## Turn 1");
  const searchArea = turnOneIndex >= 0 ? content.slice(turnOneIndex) : content;
  const fenceMatch = searchArea.match(/```(?:text)?\n([\s\S]*?)```/);

  if (!fenceMatch?.[1]?.trim()) {
    throw new Error(`Could not extract Turn 1 prompt from ${playbookPath}.`);
  }

  return fenceMatch[1].trim();
}

function statusFromResponse(input) {
  if (!input.ok) {
    return "failed";
  }

  if (input.requestedProvider === "mock") {
    return "mock_success";
  }

  if (input.actualProvider === input.requestedProvider) {
    return "live_success";
  }

  return "provider_mismatch";
}

function safePreview(value, limit = 520) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function reportMarkdown(report) {
  return [
    `# Live Provider Smoke ${report.startedAt}`,
    "",
    `- status: ${report.status}`,
    `- baseUrl: ${report.baseUrl}`,
    `- problemId: ${report.problemId}`,
    `- requestedProvider: ${report.requestedProvider}`,
    `- requestedModel: ${report.requestedModel}`,
    `- actualProvider: ${report.actualProvider ?? "none"}`,
    `- actualModel: ${report.actualModel ?? "none"}`,
    `- latencyMs: ${report.latencyMs ?? "unknown"}`,
    `- usageInputTokens: ${report.usageInputTokens ?? "unknown"}`,
    `- usageOutputTokens: ${report.usageOutputTokens ?? "unknown"}`,
    "",
    "## Env Availability",
    "",
    ...Object.entries(report.envAvailability).map(([provider, available]) => `- ${provider}: ${available ? "configured" : "missing"}`),
    "",
    "## Prompt Preview",
    "",
    "```text",
    report.promptPreview,
    "```",
    "",
    "## Response Preview",
    "",
    "```text",
    report.responsePreview || report.error || "(empty)",
    "```",
    "",
    "## Notes",
    "",
    report.status === "live_success"
      ? "- Live provider route succeeded through the SKAI /api/chat path."
      : "- This is not a live-provider success. Check provider key, server env reload, model name, or network/provider availability.",
    "",
  ].join("\n");
}

async function writeReport(report) {
  const outputDir = path.join(process.cwd(), "docs/technical/live_smoke");
  const safeStartedAt = report.startedAt.replace(/[:.]/g, "-");
  const baseName = `${safeStartedAt}_${report.requestedProvider}_${report.problemId}`;
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const mdPath = path.join(outputDir, `${baseName}.md`);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, reportMarkdown(report));

  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { env, availability } = await loadEnv();
  const requestedProvider = selectProvider(args.provider, availability);
  const requestedModel = args.model || env[`${requestedProvider.toUpperCase()}_MODEL`] || providerModels[requestedProvider] || "mock-orchestrator";
  const prompt = await extractTurnOnePrompt(args.playbook);
  const startedAt = new Date().toISOString();
  const requestStartedAt = Date.now();

  const report = {
    startedAt,
    baseUrl: args.baseUrl,
    problemId: args.problemId,
    requestedProvider,
    requestedModel,
    actualProvider: null,
    actualModel: null,
    status: "failed",
    latencyMs: null,
    usageInputTokens: null,
    usageOutputTokens: null,
    envAvailability: availability,
    promptPreview: safePreview(prompt),
    responsePreview: "",
    error: "",
  };

  try {
    const response = await fetch(`${args.baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: args.problemId,
        provider: requestedProvider,
        model: requestedModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
    const responseText = await response.text();

    if (!response.ok) {
      report.error = `HTTP ${response.status}: ${safePreview(responseText, 1200)}`;
      report.status = "failed";
    } else {
      const json = JSON.parse(responseText);
      report.actualProvider = json.modelRun?.provider ?? null;
      report.actualModel = json.modelRun?.model ?? null;
      report.latencyMs = json.modelRun?.latencyMs ?? Date.now() - requestStartedAt;
      report.usageInputTokens = json.modelRun?.usageInputTokens ?? null;
      report.usageOutputTokens = json.modelRun?.usageOutputTokens ?? null;
      report.responsePreview = safePreview(json.message ?? "");
      report.status = statusFromResponse({
        ok: true,
        requestedProvider,
        actualProvider: report.actualProvider,
        message: json.message ?? "",
      });
    }
  } catch (error) {
    const cause =
      error && typeof error === "object" && "cause" in error && error.cause && typeof error.cause === "object" && "message" in error.cause
        ? ` (${String(error.cause.message)})`
        : "";
    report.error = error instanceof Error ? `${error.message}${cause}` : "Unknown smoke error.";
    report.status = "failed";
  }

  if (args.write) {
    const paths = await writeReport(report);
    report.reportPaths = {
      json: path.relative(process.cwd(), paths.jsonPath),
      markdown: path.relative(process.cwd(), paths.mdPath),
    };
  }

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== "live_success" && report.status !== "mock_success") {
    process.exitCode = 1;
  }
}

await main();
