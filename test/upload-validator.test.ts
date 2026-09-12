import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/ingestion/types";
import { validateUpload } from "@/lib/ingestion/upload-validator";

import { createUploadFile } from "./fixtures/upload-file";

function expectError(
  result: ReturnType<typeof validateUpload>,
  code: string,
): void {
  expect(result.valid).toBe(false);

  if (!result.valid) {
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code })]));
  }
}

describe("validateUpload", () => {
  it("rejects a missing file", () => {
    expectError(validateUpload(undefined), "missing_file");
  });

  it("rejects an unsupported MIME type", () => {
    const result = validateUpload(createUploadFile("notice", "notice.pdf", "text/plain"));

    expectError(result, "unsupported_media_type");
  });

  it("rejects a .txt file with text/plain type because neither format is supported", () => {
    const result = validateUpload(createUploadFile("notice", "notice.txt", "text/plain"));

    expectError(result, "unsupported_media_type");
    expectError(result, "media_type_mismatch");
  });

  it("rejects an unsupported extension", () => {
    const result = validateUpload(createUploadFile("notice", "notice.txt", "application/pdf"));

    expectError(result, "media_type_mismatch");
  });

  it("rejects a zero-byte file", () => {
    expectError(
      validateUpload(createUploadFile([], "notice.pdf", "application/pdf")),
      "empty_file",
    );
  });

  it("rejects a file larger than 20 MB", () => {
    const file = createUploadFile(
      new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1),
      "notice.pdf",
      "application/pdf",
    );

    expectError(validateUpload(file), "file_too_large");
  });

  it("rejects an extension and MIME type mismatch", () => {
    expectError(
      validateUpload(createUploadFile("notice", "notice.png", "image/jpeg")),
      "media_type_mismatch",
    );
  });

  it.each([
    ["notice.pdf", "application/pdf"],
    ["notice.jpg", "image/jpeg"],
    ["notice.png", "image/png"],
  ] as const)("accepts a valid %s upload", (name, type) => {
    expect(validateUpload(createUploadFile("notice", name, type))).toEqual({
      valid: true,
      mediaType: type,
    });
  });
});
