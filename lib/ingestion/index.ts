export type {
  DocumentIdentity,
  DocumentMetadata,
  ExtractionError,
  ExtractionErrorCode,
  ImageBoundingBox,
  NormalizedIngestionResult,
  SourceLocation,
  SourceSegment,
  SupportedMediaType,
  UploadValidationError,
  UploadValidationErrorCode,
  UploadValidationResult,
} from "./types";

export { MAX_UPLOAD_SIZE_BYTES } from "./types";
export { extractPdfText, MAX_PDF_PAGES } from "./pdf-extractor";
export type { PdfData } from "./pdf-extractor";
export { validateUpload } from "./upload-validator";
