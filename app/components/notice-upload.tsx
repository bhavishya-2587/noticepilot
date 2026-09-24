"use client";

import Image from "next/image";
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
  onContinue?: (file: File) => void;
  submissionState?: NoticeUploadSubmissionState;
  className?: string;
}

const ACCEPTED_FILE_TYPES =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);

function getExtension(filename: string): string {
  const filenameOnly = filename.split(/[\\/]/).pop() ?? "";
  const separator = filenameOnly.lastIndexOf(".");

  return separator === -1
    ? ""
    : filenameOnly.slice(separator + 1).toLowerCase();
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
  className = "",
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

  const displayedError =
    clientError ??
    (submissionState.status === "error"
      ? submissionState.message
      : null);

  return (
    <section
      aria-labelledby="upload-heading"
      className={`w-full rounded-3xl border border-cyan-200/15 bg-gradient-to-br from-[#0b1b2d] via-[#071321] to-[#050c17] p-5 shadow-2xl shadow-cyan-950/30 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/25 bg-[#0b1b2d]">
          <Image
            src="/upload-icon.png"
            alt=""
            width={64}
            height={64}
            className="h-14 w-14 object-contain"
            aria-hidden="true"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
            Start here
          </p>

          <h2
            id="upload-heading"
            className="mt-1 text-xl font-semibold text-white"
          >
            Upload a notice
          </h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        Choose a PDF, JPG, JPEG, or PNG notice. Files can be up to{" "}
        {MAX_UPLOAD_SIZE_MB} MB.
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

          if (!isDisabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-5 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center outline-offset-4 transition ${
          isDragging
            ? "border-cyan-300 bg-cyan-300/10"
            : "border-cyan-100/20 bg-black/10 hover:border-cyan-200/50 hover:bg-cyan-200/[0.04]"
        } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-2xl text-cyan-200">
          ↑
        </div>

        <p className="mt-4 font-medium text-white">
          Drag and drop your notice here
        </p>

        <p className="mt-1 text-sm text-slate-400">
          or click to browse your device
        </p>
      </div>

      <p
        id="upload-help"
        className="mt-3 text-xs leading-5 text-slate-500"
      >
        Accepted formats: PDF, JPG/JPEG, PNG. Maximum size:{" "}
        {MAX_UPLOAD_SIZE_MB} MB.
      </p>

      {selectedFile ? (
        <div className="mt-5 rounded-2xl border border-cyan-200/15 bg-white/[0.05] p-4">
          <p
            className="break-words font-medium text-white"
            title={selectedFile.name}
          >
            {selectedFile.name}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {formatFileSize(selectedFile.size)} ·{" "}
            {selectedFile.type || "Unknown file type"}
          </p>

          <button
            type="button"
            className="mt-3 text-sm font-medium text-cyan-200 underline underline-offset-4 transition hover:text-white"
            onClick={removeFile}
            disabled={isDisabled}
          >
            Remove file
          </button>
        </div>
      ) : null}

      <div
        id="upload-feedback"
        className="mt-4"
        aria-live="polite"
      >
        {displayedError ? (
          <p
            role="alert"
            className="text-sm font-medium text-red-300"
          >
            {displayedError}
          </p>
        ) : null}

        {submissionState.status === "processing" ? (
          <p className="text-sm font-medium text-cyan-100">
            Preparing your notice…
          </p>
        ) : null}

        {submissionState.status === "success" ? (
          <p className="text-sm font-medium text-emerald-200">
            {submissionState.message ??
              "Notice received successfully."}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 font-medium text-cyan-50 transition hover:border-cyan-100/40 hover:bg-cyan-200/20 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDisabled}
        onClick={continueWithFile}
      >
        {isSubmitting ? "Preparing notice…" : "Continue"}
      </button>
    </section>
  );
}