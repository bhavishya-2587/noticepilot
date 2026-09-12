import { ingestNotice } from "@/lib/ingestion/ingest-notice";
import type { NoticeIngestionResponse } from "@/lib/ingestion/ingestion-response";
import type { NormalizedIngestionResult } from "@/lib/ingestion/types";

function json(body: NoticeIngestionResponse, status: number): Response {
  return Response.json(body, { status });
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function statusFor(result: NormalizedIngestionResult): number {
  if (result.status === "success" || result.status === "empty") {
    return 200;
  }

  return "validationErrors" in result ? 400 : 422;
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "The upload request could not be read.",
        },
      },
      400,
    );
  }

  const upload = formData.get("file");

  if (upload === null) {
    return json(
      {
        result: {
          status: "failed",
          extractedText: "",
          sourceSegments: [],
          error: { code: "missing_file", message: "A file must be provided." },
          validationErrors: [
            { code: "missing_file", message: "A file must be provided." },
          ],
        },
      },
      400,
    );
  }

  if (!isFile(upload)) {
    return json(
      {
        result: {
          status: "failed",
          extractedText: "",
          sourceSegments: [],
          error: { code: "invalid_file", message: "A valid file must be provided." },
          validationErrors: [
            { code: "invalid_file", message: "A valid file must be provided." },
          ],
        },
      },
      400,
    );
  }

  try {
    const result = await ingestNotice(upload);
    return json({ result }, statusFor(result));
  } catch {
    return json(
      {
        error: {
          code: "internal_error",
          message: "We could not process this notice. Please try again.",
        },
      },
      500,
    );
  }
}
