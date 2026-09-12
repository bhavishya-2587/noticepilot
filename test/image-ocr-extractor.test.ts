import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";

const recognize = vi.fn();
const terminate = vi.fn();

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(async () => ({ recognize, terminate })),
}));

import { extractImageText } from "@/lib/ingestion/image-ocr-extractor";

const document = {
  documentId: "image-test",
  originalFilename: "notice.png",
  mediaType: "image/png" as const,
};

describe("extractImageText", () => {
  beforeEach(() => {
    recognize.mockReset();
    terminate.mockReset();
  });

  it("returns OCR text, image provenance, and Tesseract confidence", async () => {
    recognize.mockResolvedValueOnce({ data: { text: "  NOTICE 42  ", confidence: 97.4 } });

    const image = Buffer.from(
      (await readFile("test/fixtures/notice-42.png.base64", "utf8")).trim(),
      "base64",
    );
    const result = await extractImageText(image, document);

    expect(result).toMatchObject({
      status: "success",
      extractedText: "NOTICE 42",
      sourceSegments: [
        {
          segmentId: "image-test-image",
          text: "NOTICE 42",
          sourceLocation: { sourceType: "image" },
          ocrConfidence: 97.4,
        },
      ],
    });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("returns empty when Tesseract recognizes no text", async () => {
    recognize.mockResolvedValueOnce({ data: { text: "   ", confidence: 0 } });

    await expect(extractImageText(new Uint8Array([137, 80, 78, 71]), document)).resolves.toMatchObject({
      status: "empty",
      extractedText: "",
      sourceSegments: [],
    });
  });

  it("returns ocr_failed and terminates the worker when recognition rejects", async () => {
    recognize.mockRejectedValueOnce(new Error("OCR worker failed"));

    await expect(extractImageText(new Uint8Array([137, 80, 78, 71]), document)).resolves.toMatchObject({
      status: "failed",
      extractedText: "",
      sourceSegments: [],
      error: { code: "ocr_failed" },
    });
    expect(terminate).toHaveBeenCalledOnce();
  });
});
