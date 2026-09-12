import { beforeEach, describe, expect, it, vi } from "vitest";

const { ingestNotice } = vi.hoisted(() => ({ ingestNotice: vi.fn() }));

vi.mock("@/lib/ingestion/ingest-notice", () => ({ ingestNotice }));

import { POST } from "@/app/api/notices/ingest/route";

import { createUploadFile } from "./fixtures/upload-file";

function requestWith(formData: FormData): Request {
  return new Request("http://localhost/api/notices/ingest", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/notices/ingest", () => {
  beforeEach(() => {
    ingestNotice.mockReset();
  });

  it("returns a structured validation result when the file is missing", async () => {
    const response = await POST(requestWith(new FormData()));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      result: { status: "failed", error: { code: "missing_file" } },
    });
    expect(ingestNotice).not.toHaveBeenCalled();
  });

  it("returns a structured validation result when file is not a File", async () => {
    const formData = new FormData();
    formData.set("file", "not-a-file");

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      result: { status: "failed", error: { code: "invalid_file" } },
    });
    expect(ingestNotice).not.toHaveBeenCalled();
  });

  it("passes a valid PDF File to ingestNotice and returns normalized text and sources", async () => {
    ingestNotice.mockResolvedValueOnce({
      status: "success",
      document: { documentId: "pdf-1", originalFilename: "notice.pdf", mediaType: "application/pdf" },
      extractedText: "Exam schedule",
      sourceSegments: [
        {
          segmentId: "pdf-1-page-1",
          text: "Exam schedule",
          sourceLocation: { sourceType: "pdf", pageNumber: 1 },
        },
      ],
      metadata: { pageCount: 1 },
    });
    const formData = new FormData();
    formData.set("file", createUploadFile("PDF", "notice.pdf", "application/pdf"));

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(200);
    expect(ingestNotice).toHaveBeenCalledWith(expect.objectContaining({
      name: "notice.pdf",
      type: "application/pdf",
    }));
    const body = await response.json();
    expect(body).toMatchObject({
      result: {
        status: "success",
        extractedText: "Exam schedule",
      },
    });
    expect(body).toMatchObject({
      result: {
        sourceSegments: [
          { sourceLocation: { sourceType: "pdf", pageNumber: 1 } },
        ],
      },
    });
  });

  it("passes a valid image File to ingestNotice", async () => {
    ingestNotice.mockResolvedValueOnce({
      status: "empty",
      document: { documentId: "image-1", originalFilename: "notice.png", mediaType: "image/png" },
      extractedText: "",
      sourceSegments: [],
    });
    const formData = new FormData();
    formData.set("file", createUploadFile("image", "notice.png", "image/png"));

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(200);
    expect(ingestNotice).toHaveBeenCalledWith(expect.objectContaining({
      name: "notice.png",
      type: "image/png",
    }));
  });

  it("maps ingestion validation failures to HTTP 400", async () => {
    ingestNotice.mockResolvedValueOnce({
      status: "failed",
      extractedText: "",
      sourceSegments: [],
      error: { code: "empty_file", message: "The file is empty." },
      validationErrors: [{ code: "empty_file", message: "The file is empty." }],
    });
    const formData = new FormData();
    formData.set("file", createUploadFile("PDF", "notice.pdf", "application/pdf"));

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      result: { status: "failed", error: { code: "empty_file" } },
    });
  });

  it("maps extraction failures to HTTP 422", async () => {
    ingestNotice.mockResolvedValueOnce({
      status: "failed",
      document: { documentId: "pdf-1", originalFilename: "notice.pdf", mediaType: "application/pdf" },
      extractedText: "",
      sourceSegments: [],
      error: { code: "text_extraction_failed", message: "The PDF could not be read." },
    });
    const formData = new FormData();
    formData.set("file", createUploadFile("PDF", "notice.pdf", "application/pdf"));

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      result: { status: "failed", error: { code: "text_extraction_failed" } },
    });
  });

  it("does not expose an unexpected error or stack trace", async () => {
    ingestNotice.mockRejectedValueOnce(new Error("secret internal detail\n at stack"));
    const formData = new FormData();
    formData.set("file", createUploadFile("PDF", "notice.pdf", "application/pdf"));

    const response = await POST(requestWith(formData));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: "internal_error",
        message: "We could not process this notice. Please try again.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
  });
});
