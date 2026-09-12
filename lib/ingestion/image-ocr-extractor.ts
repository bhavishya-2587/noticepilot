import { Buffer } from "node:buffer";

import { createWorker } from "tesseract.js";

import type {
  DocumentIdentity,
  NormalizedIngestionResult,
} from "./types";

export type ImageData = Buffer | Uint8Array | ArrayBuffer;

function normalizeImageData(data: ImageData): Buffer {
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  return Buffer.from(data);
}

function createFailureResult(
  document: DocumentIdentity,
  error: unknown,
): NormalizedIngestionResult {
  return {
    status: "failed",
    document,
    extractedText: "",
    sourceSegments: [],
    error: {
      code: "ocr_failed",
      message:
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "The image could not be processed with OCR.",
    },
  };
}

export async function extractImageText(
  data: ImageData,
  document: DocumentIdentity,
): Promise<NormalizedIngestionResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

  try {
    worker = await createWorker("eng");
    const result = await worker.recognize(normalizeImageData(data));
    const text = result.data.text.trim();

    if (text.length === 0) {
      return {
        status: "empty",
        document,
        extractedText: "",
        sourceSegments: [],
      };
    }

    return {
      status: "success",
      document,
      extractedText: text,
      sourceSegments: [
        {
          segmentId: `${document.documentId}-image`,
          text,
          sourceLocation: { sourceType: "image" },
          ocrConfidence: result.data.confidence,
        },
      ],
    };
  } catch (error) {
    return createFailureResult(document, error);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // The OCR result or failure above remains the authoritative outcome.
      }
    }
  }
}
