import { describe, expect, it, vi } from "vitest";

const getPage = vi.fn();
const cleanup = vi.fn();

vi.mock("unpdf", () => ({
  getDocumentProxy: vi.fn(async () => ({
    numPages: 101,
    getPage,
    cleanup,
  })),
}));

import { extractPdfText } from "@/lib/ingestion/pdf-extractor";

describe("extractPdfText page limit", () => {
  it("rejects a PDF over 100 pages before requesting a page", async () => {
    const result = await extractPdfText(new Uint8Array([1]), {
      documentId: "limit-test",
      originalFilename: "large.pdf",
      mediaType: "application/pdf",
    });

    expect(result).toMatchObject({
      status: "failed",
      error: { code: "page_limit_exceeded" },
    });
    expect(getPage).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
