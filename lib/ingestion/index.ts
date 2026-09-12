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
  ValidationFailureIngestionResult,
  UploadValidationResult,
} from "./types";

export {
  MAX_UPLOAD_SIZE_BYTES,
  SUPPORTED_UPLOAD_FILE_EXTENSIONS,
  SUPPORTED_UPLOAD_MEDIA_TYPES,
} from "./types";
export { extractPdfText, MAX_PDF_PAGES } from "./pdf-extractor";
export type { PdfData } from "./pdf-extractor";
export { extractImageText } from "./image-ocr-extractor";
export type { ImageData } from "./image-ocr-extractor";
export { validateUpload } from "./upload-validator";
export { ingestNotice } from "./ingest-notice";
