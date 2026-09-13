import Tesseract from "tesseract.js/dist/tesseract.min.js";

import type {
  DocumentIdentity,
  NormalizedIngestionResult,
} from "./types";

export type ImageData = Blob | string;

function createFailureResult(
  document: DocumentIdentity,
): NormalizedIngestionResult {
  return {
    status: "failed",
    document,
    extractedText: "",
    sourceSegments: [],
    error: {
      code: "ocr_failed",
      message: "The image could not be processed with OCR.",
    },
  };
}

export async function extractImageText(
  data: ImageData,
  document: DocumentIdentity,
): Promise<NormalizedIngestionResult> {
  let worker: Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;
  let imageUrl: string | undefined;

  try {
    worker = await Tesseract.createWorker("eng");
    const imageSource =
      typeof data === "string"
        ? data
        : (imageUrl = URL.createObjectURL(data));
    const result = await worker.recognize(imageSource);
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
  } catch {
    return createFailureResult(document);
  } finally {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // The OCR result or failure above remains the authoritative outcome.
      }
    }
  }
}
