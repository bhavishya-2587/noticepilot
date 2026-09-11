import {
  MAX_UPLOAD_SIZE_BYTES,
  type SupportedMediaType,
  type UploadValidationError,
  type UploadValidationResult,
} from "./types";

const MEDIA_TYPE_BY_EXTENSION: Record<string, SupportedMediaType> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const SUPPORTED_MEDIA_TYPES = new Set<SupportedMediaType>(
  Object.values(MEDIA_TYPE_BY_EXTENSION),
);

function getFilenameExtension(filename: string): string {
  const filenameOnly = filename.split(/[\\/]/).pop() ?? "";
  const extensionSeparator = filenameOnly.lastIndexOf(".");

  return extensionSeparator === -1
    ? ""
    : filenameOnly.slice(extensionSeparator + 1).toLowerCase();
}

function createError(
  code: UploadValidationError["code"],
  message: string,
): UploadValidationError {
  return { code, message };
}

function isSupportedMediaType(
  mediaType: string,
): mediaType is SupportedMediaType {
  return SUPPORTED_MEDIA_TYPES.has(mediaType as SupportedMediaType);
}

export function validateUpload(
  file: File | null | undefined,
): UploadValidationResult {
  if (file === null || file === undefined) {
    return {
      valid: false,
      errors: [
        createError("missing_file", "A file must be provided."),
      ],
    };
  }

  if (
    typeof file !== "object" ||
    typeof file.name !== "string" ||
    typeof file.type !== "string" ||
    typeof file.size !== "number" ||
    !Number.isFinite(file.size) ||
    file.size < 0
  ) {
    return {
      valid: false,
      errors: [createError("invalid_file", "A valid file must be provided.")],
    };
  }

  const errors: UploadValidationError[] = [];
  const mediaType = file.type.trim().toLowerCase();
  const supportedMediaType = isSupportedMediaType(mediaType)
    ? mediaType
    : undefined;
  const extension = getFilenameExtension(file.name);
  const extensionMediaType = MEDIA_TYPE_BY_EXTENSION[extension];

  if (file.size === 0) {
    errors.push(createError("empty_file", "The file is empty."));
  } else if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    errors.push(
      createError(
        "file_too_large",
        `The file must be no larger than ${MAX_UPLOAD_SIZE_BYTES} bytes.`,
      ),
    );
  }

  if (!supportedMediaType) {
    errors.push(
      createError("unsupported_media_type", "The file type is not supported."),
    );
  }

  if (!extensionMediaType || extensionMediaType !== mediaType) {
    errors.push(
      createError(
        "media_type_mismatch",
        "The filename extension and MIME type must identify the same supported format.",
      ),
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (!supportedMediaType) {
    return {
      valid: false,
      errors: [
        createError("unsupported_media_type", "The file type is not supported."),
      ],
    };
  }

  return {
    valid: true,
    mediaType: supportedMediaType,
  };
}
