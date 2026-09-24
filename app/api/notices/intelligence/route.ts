import type { NormalizedIngestionResult } from "@/lib/ingestion/types";
import {
  getSafeIntelligenceFailureMessage,
  isIntelligenceFailure,
} from "@/lib/intelligence/errors";
import { extractNoticeIntelligence } from "@/lib/intelligence/extraction";
import type { IntelligenceResult } from "@/lib/intelligence/schema";

export const runtime = "nodejs";

type IntelligenceResponse =
  | {
      result: IntelligenceResult;
    }
  | {
      error: {
        code: "invalid_request" | "internal_error" | "intelligence_failed";
        message: string;
      };
    };

function json(body: IntelligenceResponse, status: number): Response {
  return Response.json(body, { status });
}

function isNormalizedIngestionResult(
  value: unknown,
): value is NormalizedIngestionResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    status?: unknown;
    extractedText?: unknown;
    sourceSegments?: unknown;
  };

  return (
    (candidate.status === "success" || candidate.status === "empty") &&
    typeof candidate.extractedText === "string" &&
    Array.isArray(candidate.sourceSegments)
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "The intelligence request could not be read.",
        },
      },
      400,
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("result" in body)
  ) {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "A normalized ingestion result must be provided.",
        },
      },
      400,
    );
  }

  const ingestionResult = (body as { result?: unknown }).result;

  if (!isNormalizedIngestionResult(ingestionResult)) {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "The normalized ingestion result is invalid.",
        },
      },
      400,
    );
  }

  if (ingestionResult.status !== "success") {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "A successfully extracted notice is required.",
        },
      },
      400,
    );
  }

  try {
    const result = await extractNoticeIntelligence(ingestionResult);

    return json({ result }, 200);
  } catch (error) {
    if (isIntelligenceFailure(error)) {
      return json(
        {
          error: {
            code: "intelligence_failed",
            message: getSafeIntelligenceFailureMessage(error),
          },
        },
        422,
      );
    }

    return json(
      {
        error: {
          code: "internal_error",
          message: "We could not interpret this notice. Please try again.",
        },
      },
      500,
    );
  }
}
