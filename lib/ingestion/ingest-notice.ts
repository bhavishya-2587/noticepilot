import "server-only";

import { randomUUID } from "node:crypto";

import { extractImageText } from "./image-ocr-extractor";
import { extractPdfText } from "./pdf-extractor";
import type {
  DocumentIdentity,
  NormalizedIngestionResult,
  UploadValidationError,
} from "./types";
import { validateUpload } from "./upload-validator";

function createValidationFailureResult(
  errors: readonly UploadValidationError[],
): NormalizedIngestionResult {
  const error =
    errors[0] ??
    ({
      code: "invalid_file",
      message: "A valid file must be provided.",
    } satisfies UploadValidationError);

  return {
    status: "failed",
    extractedText: "",
    sourceSegments: [],
    error,
    validationErrors: errors,
  };
}

function createReadFailureResult(
  document: DocumentIdentity,
): NormalizedIngestionResult {
  return {
    status: "failed",
    document,
    extractedText: "",
    sourceSegments: [],
    error: {
      code: "document_unreadable",
      message: "The uploaded file could not be read.",
    },
  };
}

export async function ingestNotice(
  file: File,
): Promise<NormalizedIngestionResult> {
  const validation = validateUpload(file);

  if (!validation.valid) {
    return createValidationFailureResult(validation.errors);
  }

  const document: DocumentIdentity = {
    documentId: randomUUID(),
    originalFilename: file.name,
    mediaType: validation.mediaType,
  };

  let data: ArrayBuffer;

  try {
    data = await file.arrayBuffer();
  } catch {
    return createReadFailureResult(document);
  }

  if (validation.mediaType === "application/pdf") {
    return extractPdfText(data, document);
  }

  return extractImageText(data, document);
}
