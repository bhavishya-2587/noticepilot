import { beforeEach, describe, expect, it, vi } from "vitest";

const { extractPdfText } = vi.hoisted(() => ({
  extractPdfText: vi.fn(),
}));

vi.mock("@/lib/ingestion/pdf-extractor", () => ({ extractPdfText }));

import { ingestNotice } from "@/lib/ingestion/ingest-notice";

import { createUploadFile } from "./fixtures/upload-file";

describe("ingestNotice", () => {
  beforeEach(() => {
    extractPdfText.mockReset();
  });

  it("fails invalid uploads before creating a document or attempting extraction", async () => {
    const result = await ingestNotice(
      createUploadFile("notice", "notice.txt", "text/plain"),
    );

    expect(result).toMatchObject({
      status: "failed",
      extractedText: "",
      sourceSegments: [],
      error: { code: "unsupported_media_type" },
      validationErrors: expect.any(Array),
    });
    expect(result).not.toHaveProperty("document");
    expect(extractPdfText).not.toHaveBeenCalled();
  });

  it("creates an identity after validation and routes PDFs to the PDF extractor", async () => {
    const normalizedResult = {
      status: "success" as const,
      document: {
        documentId: "created-by-orchestrator",
        originalFilename: "notice.pdf",
        mediaType: "application/pdf" as const,
      },
      extractedText: "PDF text",
      sourceSegments: [],
    };
    extractPdfText.mockResolvedValueOnce(normalizedResult);
    const file = createUploadFile("PDF", "notice.pdf", "application/pdf");

    await expect(ingestNotice(file)).resolves.toBe(normalizedResult);

    expect(extractPdfText).toHaveBeenCalledOnce();
    const [data, document] = extractPdfText.mock.calls[0] ?? [];
    expect(data).toBeInstanceOf(ArrayBuffer);
    expect(document).toMatchObject({
      originalFilename: "notice.pdf",
      mediaType: "application/pdf",
      documentId: expect.any(String),
    });
  });

  it.each([
    ["notice.jpg", "image/jpeg"],
    ["notice.png", "image/png"],
  ] as const)("returns a safe result for direct server-side %s ingestion", async (name, type) => {
    await expect(ingestNotice(createUploadFile("image", name, type))).resolves.toMatchObject({
      status: "failed",
      document: {
        originalFilename: name,
        mediaType: type,
        documentId: expect.any(String),
      },
      error: { code: "ocr_failed" },
    });
  });

  it("returns document_unreadable when a validated file cannot be read", async () => {
    const file = createUploadFile("PDF", "notice.pdf", "application/pdf");
    Object.defineProperty(file, "arrayBuffer", {
      value: vi.fn().mockRejectedValue(new Error("read failed")),
    });

    const result = await ingestNotice(file);

    expect(result).toMatchObject({
      status: "failed",
      document: {
        originalFilename: "notice.pdf",
        mediaType: "application/pdf",
        documentId: expect.any(String),
      },
      error: { code: "document_unreadable" },
    });
    expect(extractPdfText).not.toHaveBeenCalled();
  });
});
