"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import {
  MAX_UPLOAD_SIZE_BYTES,
  SUPPORTED_UPLOAD_FILE_EXTENSIONS,
  SUPPORTED_UPLOAD_MEDIA_TYPES,
} from "@/lib/ingestion/types";

export type NoticeUploadSubmissionState =
  | { status: "idle" }
  | { status: "processing"; message?: string }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

interface NoticeUploadProps {
  /**
   * Receives the validated browser File when the student chooses Continue.
   * Task 13 can connect this callback from a client-side submission boundary.
   */
  onContinue?: (file: File) => void;
  /**
   * Submission state is controlled by the future ingestion integration. Until
   * then the component manages idle, selected, and client-validation states.
   */
  submissionState?: NoticeUploadSubmissionState;
}

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);

function getExtension(filename: string): string {
  const filenameOnly = filename.split(/[\\/]/).pop() ?? "";
  const separator = filenameOnly.lastIndexOf(".");

  return separator === -1 ? "" : filenameOnly.slice(separator + 1).toLowerCase();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getClientValidationError(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `Choose a file no larger than ${MAX_UPLOAD_SIZE_MB} MB.`;
  }

  const mediaType = file.type.trim().toLowerCase();
  const extension = getExtension(file.name);
  const hasSupportedMediaType = SUPPORTED_UPLOAD_MEDIA_TYPES.includes(
    mediaType as (typeof SUPPORTED_UPLOAD_MEDIA_TYPES)[number],
  );
  const hasSupportedExtension = SUPPORTED_UPLOAD_FILE_EXTENSIONS.includes(
    extension as (typeof SUPPORTED_UPLOAD_FILE_EXTENSIONS)[number],
  );

  if (!hasSupportedMediaType || !hasSupportedExtension) {
    return "Choose a PDF, JPG, JPEG, or PNG file.";
  }

  return null;
}

export function NoticeUpload({
  onContinue,
  submissionState = { status: "idle" },
}: NoticeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isSubmitting = submissionState.status === "processing";
  const isDisabled = isSubmitting;

  function selectFile(file: File | null | undefined) {
    if (!file) {
      setSelectedFile(null);
      setClientError("Choose a file to continue.");
      return;
    }

    const validationError = getClientValidationError(file);
    if (validationError) {
      setSelectedFile(null);
      setClientError(validationError);
      return;
    }

    setSelectedFile(file);
    setClientError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isDisabled) {
      selectFile(event.dataTransfer.files?.[0]);
    }
  }

  function openFilePicker() {
    if (!isDisabled) {
      inputRef.current?.click();
    }
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.focus();
      openFilePicker();
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setClientError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function continueWithFile() {
    if (!selectedFile) {
      setClientError("Choose a file to continue.");
      return;
    }

    onContinue?.(selectedFile);
  }

  const displayedError = clientError ?? (submissionState.status === "error" ? submissionState.message : null);

  return (
    <section aria-labelledby="upload-heading" className="w-full max-w-xl rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <h2 id="upload-heading" className="text-xl font-semibold">Upload a notice</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Choose a PDF, JPG, JPEG, or PNG notice. Files can be up to {MAX_UPLOAD_SIZE_MB} MB.
      </p>

      <input
        ref={inputRef}
        id="notice-file"
        className="sr-only"
        type="file"
        aria-label="Choose a notice file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={isDisabled}
        aria-describedby="upload-help upload-feedback"
        onChange={handleFileChange}
      />

      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-controls="notice-file"
        aria-disabled={isDisabled}
        onClick={openFilePicker}
        onKeyDown={handleDropZoneKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isDisabled) setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-5 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center outline-offset-4 transition ${
          isDragging
            ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-600 dark:hover:border-zinc-400"
        } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <p className="font-medium">Drag and drop your notice here</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">or click to browse your device</p>
      </div>
      <p id="upload-help" className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
        Accepted formats: PDF, JPG/JPEG, PNG. Maximum size: {MAX_UPLOAD_SIZE_MB} MB.
      </p>

      {selectedFile ? (
        <div className="mt-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="break-words font-medium" title={selectedFile.name}>{selectedFile.name}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {formatFileSize(selectedFile.size)} · {selectedFile.type || "Unknown file type"}
          </p>
          <button type="button" className="mt-3 text-sm font-medium underline underline-offset-4" onClick={removeFile} disabled={isDisabled}>
            Remove file
          </button>
        </div>
      ) : null}

      <div id="upload-feedback" className="mt-4" aria-live="polite">
        {displayedError ? <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{displayedError}</p> : null}
        {submissionState.status === "processing" ? <p className="text-sm font-medium">Preparing your notice…</p> : null}
        {submissionState.status === "success" ? <p className="text-sm font-medium">{submissionState.message ?? "Notice received successfully."}</p> : null}
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        disabled={isDisabled}
        onClick={continueWithFile}
      >
        {isSubmitting ? "Preparing notice…" : "Continue"}
      </button>
    </section>
  );
}
