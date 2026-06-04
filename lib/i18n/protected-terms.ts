export const protectedSkaiTerms = [
  "SKAI",
  ".skai",
  "Orchestration",
  "Prompt",
  "Response",
  "Status",
  "Trace",
  "Artifact",
  "3D Dual Graph",
  "Branch",
  "Replay",
  "Breakpoint",
  "Judge",
  "Coaching",
  "Fixture",
  "Extension",
] as const;

export type ProtectedSkaiTerm = (typeof protectedSkaiTerms)[number];

