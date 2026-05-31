export const SKAI_STORAGE_KEYS = {
  attempts: "skai:attempts",
  publishedAttempts: "skai:publishedAttempts",
} as const;

export const budgetGuardrails = {
  maxTurnsPerAttempt: Number(process.env.SKAI_MAX_TURNS_PER_ATTEMPT ?? 18),
  maxInputCharsPerTurn: Number(process.env.SKAI_MAX_INPUT_CHARS_PER_TURN ?? 6000),
  monthlyCapKrw: 200_000,
  eventCapKrw: 100_000,
};

