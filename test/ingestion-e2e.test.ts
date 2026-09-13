import { describe, expect, it } from "vitest";

import { ingestNotice } from "@/lib/ingestion/ingest-notice";

import { createTextPdf } from "./fixtures/build-pdf";
import { createUploadFile } from "./fixtures/upload-file";

describe("notice ingestion end-to-end", () => {
  it("extracts text and preserves page provenance from a real PDF", async () => {
    const pdf = createTextPdf([
      "Semester examination schedule",
      "Form submission deadline: 20 September",
    ]);

    const pdfBuffer = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(pdfBuffer).set(pdf);

    const file = createUploadFile(
      pdfBuffer,
      "exam-schedule.pdf",
      "application/pdf",
    );

    const result = await ingestNotice(file);

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      throw new Error("Expected successful PDF ingestion");
    }

    expect(result.document.originalFilename).toBe("exam-schedule.pdf");
    expect(result.document.mediaType).toBe("application/pdf");

    expect(result.extractedText).toContain("Semester examination schedule");
    expect(result.extractedText).toContain(
      "Form submission deadline: 20 September",
    );

    expect(result.sourceSegments).toHaveLength(2);

    expect(result.sourceSegments[0]).toMatchObject({
      text: "Semester examination schedule",
      sourceLocation: {
        sourceType: "pdf",
        pageNumber: 1,
      },
    });

    expect(result.sourceSegments[1]).toMatchObject({
      text: "Form submission deadline: 20 September",
      sourceLocation: {
        sourceType: "pdf",
        pageNumber: 2,
      },
    });
  });
});