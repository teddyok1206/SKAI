export const SKAI_STORAGE_KEYS = {
  attempts: "skai:attempts",
  publishedAttempts: "skai:publishedAttempts",
  promptComments: "skai:promptComments",
  authoredProblems: "skai:authoredProblems",
  founderReviewNotes: "skai:founderReviewNotes",
} as const;

export const budgetGuardrails = {
  maxTurnsPerAttempt: Number(process.env.SKAI_MAX_TURNS_PER_ATTEMPT ?? 18),
  maxInputCharsPerTurn: Number(process.env.SKAI_MAX_INPUT_CHARS_PER_TURN ?? 6000),
  monthlyCapKrw: 200_000,
  eventCapKrw: 100_000,
  krwPerUsdEstimate: Number(process.env.NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE ?? 1400),
};

export const operationGuardrails = {
  maxMessagesPerRequest: Number(process.env.SKAI_MAX_MESSAGES_PER_REQUEST ?? 40),
  maxTraceEventsPerJudge: Number(process.env.SKAI_MAX_TRACE_EVENTS_PER_JUDGE ?? 80),
  maxAttachmentsPerMessage: Number(process.env.SKAI_MAX_ATTACHMENTS_PER_MESSAGE ?? 6),
  maxUploadBytes: Number(process.env.SKAI_MAX_UPLOAD_BYTES ?? 4_000_000),
  maxAttachmentTextChars: Number(process.env.SKAI_MAX_ATTACHMENT_TEXT_CHARS ?? 20_000),
  maxAttachmentDataUrlChars: Number(process.env.SKAI_MAX_ATTACHMENT_DATA_URL_CHARS ?? 5_600_000),
  maxMessageContentChars: Number(process.env.SKAI_MAX_MESSAGE_CONTENT_CHARS ?? 30_000),
  maxFinalAnswerChars: Number(process.env.SKAI_MAX_FINAL_ANSWER_CHARS ?? 20_000),
  maxCommentBodyChars: Number(process.env.SKAI_MAX_COMMENT_BODY_CHARS ?? 1_200),
  maxModelNameChars: Number(process.env.SKAI_MAX_MODEL_NAME_CHARS ?? 160),
  maxPublishedSnapshotChars: Number(process.env.SKAI_MAX_PUBLISHED_SNAPSHOT_CHARS ?? 2_000_000),
};
