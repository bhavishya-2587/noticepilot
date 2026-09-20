import "server-only";

export type IntelligenceFailureCode =
  | "input_invalid"
  | "provider_unavailable"
  | "output_invalid"
  | "evidence_invalid";

export class IntelligenceFailure extends Error {
  readonly code: IntelligenceFailureCode;
  readonly cause?: unknown;

  constructor(
    code: IntelligenceFailureCode,
    message: string,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "IntelligenceFailure";
    this.code = code;
    this.cause = options?.cause;
  }
}

export function isIntelligenceFailure(
  error: unknown,
): error is IntelligenceFailure {
  return error instanceof IntelligenceFailure;
}

export function getSafeIntelligenceFailureMessage(
  error: IntelligenceFailure,
): string {
  switch (error.code) {
    case "input_invalid":
      return "The notice could not be processed for intelligence extraction.";

    case "provider_unavailable":
      return "Notice intelligence is temporarily unavailable. Please try again later.";

    case "output_invalid":
      return "The notice could not be interpreted reliably.";

    case "evidence_invalid":
      return "The extracted information could not be verified against the notice.";

    default:
      return "Notice intelligence could not be completed.";
  }
}