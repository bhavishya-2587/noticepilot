import type { NormalizedIngestionResult } from "./types";

/** The JSON contract returned by the notice-ingestion Route Handler. */
export type NoticeIngestionResponse =
  | { result: NormalizedIngestionResult }
  | {
      error: {
        code: "invalid_request" | "internal_error";
        message: string;
      };
    };
