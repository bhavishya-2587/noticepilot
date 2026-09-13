import { describe, expect, it } from "vitest";

import { extractPdfText } from "@/lib/ingestion/pdf-extractor";

import { createTextlessPdf, createTextPdf } from "./fixtures/build-pdf";

const document = {
  documentId: "pdf-test",
  originalFilename: "notice.pdf",
  mediaType: "application/pdf" as const,
};

describe("extractPdfText", () => {
  it("extracts normalized text and page source segments from a representative PDF", async () => {
    const result = await extractPdfText(
      createTextPdf(["First   page", "Second page"]),
      document,
    );

    expect(result).toMatchObject({
      status: "success",
      extractedText: "First page\n\nSecond page",
      metadata: { pageCount: 2 },
    });
    expect(result.sourceSegments).toEqual([
      expect.objectContaining({
        segmentId: "pdf-test-page-1",
        text: "First page",
        sourceLocation: { sourceType: "pdf", pageNumber: 1 },
      }),
      expect.objectContaining({
        segmentId: "pdf-test-page-2",
        text: "Second page",
        sourceLocation: { sourceType: "pdf", pageNumber: 2 },
      }),
    ]);
  });

  it("returns empty for a readable PDF with no text", async () => {
    await expect(extractPdfText(createTextlessPdf(), document)).resolves.toMatchObject({
      status: "empty",
      extractedText: "",
      sourceSegments: [],
      metadata: { pageCount: 1 },
    });
  });

  it("returns document_unreadable for malformed PDF data", async () => {
    const result = await extractPdfText(
      new TextEncoder().encode("not a PDF"),
      document,
    );

    expect(result).toMatchObject({
      status: "failed",
      error: {
        code: "document_unreadable",
        message: "The uploaded PDF could not be read.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("Invalid PDF");
  });
});
