export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export type SupportedMediaType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png";

export interface DocumentIdentity {
  documentId: string;
  originalFilename: string;
  mediaType: SupportedMediaType;
}

export interface DocumentMetadata {
  pageCount?: number;
}

export interface ImageBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SourceLocation =
  | {
      sourceType: "pdf";
      pageNumber: number;
    }
  | {
      sourceType: "image";
      boundingBox: ImageBoundingBox;
    };

export interface SourceSegment {
  segmentId: string;
  text: string;
  sourceLocation: SourceLocation;
  ocrConfidence?: number;
}

export type UploadValidationErrorCode =
  | "invalid_file"
  | "empty_file"
  | "missing_file"
  | "unsupported_media_type"
  | "file_too_large"
  | "media_type_mismatch";

export interface UploadValidationError {
  code: UploadValidationErrorCode;
  message: string;
}

export type UploadValidationResult =
  | {
      valid: true;
      mediaType: SupportedMediaType;
    }
  | {
      valid: false;
      errors: readonly UploadValidationError[];
    };

export type ExtractionErrorCode =
  | "document_unreadable"
  | "text_extraction_failed"
  | "page_limit_exceeded"
  | "ocr_failed";

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
}

interface IngestionResultBase {
  document: DocumentIdentity;
  extractedText: string;
  sourceSegments: readonly SourceSegment[];
  metadata?: DocumentMetadata;
}

export type NormalizedIngestionResult =
  | (IngestionResultBase & {
      status: "success";
    })
  | (IngestionResultBase & {
      status: "empty";
      extractedText: "";
      sourceSegments: readonly [];
    })
  | (IngestionResultBase & {
      status: "failed";
      error: ExtractionError;
    });
