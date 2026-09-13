"use client";

import { useRef, useState } from "react";

import type { NoticeIngestionResponse } from "@/lib/ingestion/ingestion-response";
import { validateUpload } from "@/lib/ingestion/upload-validator";
import type {
  DocumentIdentity,
  NormalizedIngestionResult,
  SourceLocation,
} from "@/lib/ingestion/types";

import {
  NoticeUpload,
  type NoticeUploadSubmissionState,
} from "./notice-upload";

function isIngestionResponse(value: unknown): value is NoticeIngestionResponse {
  return typeof value === "object" && value !== null && ("result" in value || "error" in value);
}

function sourceLabel(sourceLocation: SourceLocation): string {
  switch (sourceLocation.sourceType) {
    case "pdf":
      return `Page ${sourceLocation.pageNumber}`;
    case "image":
      return "Image";
    case "image-region": {
      const { x, y, width, height } = sourceLocation.boundingBox;
      return `Image region (${x}, ${y}, ${width} × ${height})`;
    }
  }
}

function ResultPreview({ result }: { result: NormalizedIngestionResult }) {
  if (result.status === "empty") {
    return (
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-live="polite">
        <h2 className="text-xl font-semibold">No readable text found</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          The notice was processed, but no extractable text was found.
        </p>
      </section>
    );
  }

  if (result.status !== "success") {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-live="polite">
      <h2 className="text-xl font-semibold">Extracted text</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {result.document.originalFilename} · {result.document.mediaType}
      </p>
      <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
        {result.extractedText}
      </pre>
      {result.sourceSegments.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-medium">Sources</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-300">
            {result.sourceSegments.map((segment) => (
              <li key={segment.segmentId}>{sourceLabel(segment.sourceLocation)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function NoticeUploadIngestion() {
  const [submissionState, setSubmissionState] = useState<NoticeUploadSubmissionState>({ status: "idle" });
  const [result, setResult] = useState<NormalizedIngestionResult | null>(null);
  const isSubmittingRef = useRef(false);

  async function onContinue(file: File) {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setResult(null);
    setSubmissionState({ status: "processing", message: "Processing your notice…" });

    try {
      const validation = validateUpload(file);

      if (!validation.valid) {
        setSubmissionState({
          status: "error",
          message:
            validation.errors[0]?.message ?? "The file could not be processed.",
        });
        return;
      }

      if (validation.mediaType !== "application/pdf") {
        const { extractImageText } = await import(
          "@/lib/ingestion/image-ocr-extractor"
        );
        const document: DocumentIdentity = {
          documentId: crypto.randomUUID(),
          originalFilename: file.name,
          mediaType: validation.mediaType,
        };
        const imageResult = await extractImageText(file, document);

        if (imageResult.status === "success" || imageResult.status === "empty") {
          setResult(imageResult);
          setSubmissionState({
            status: "success",
            message:
              imageResult.status === "success"
                ? "Text extracted successfully."
                : "Notice processed.",
          });
        } else {
          setSubmissionState({ status: "error", message: imageResult.error.message });
        }
        return;
      }

      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/notices/ingest", { method: "POST", body: formData });
      const payload: unknown = await response.json();

      if (!isIngestionResponse(payload)) {
        throw new Error("Unexpected response");
      }

      if ("result" in payload) {
        if (payload.result.status === "success") {
          setResult(payload.result);
          setSubmissionState({ status: "success", message: "Text extracted successfully." });
          return;
        }

        if (payload.result.status === "empty") {
          setResult(payload.result);
          setSubmissionState({ status: "success", message: "Notice processed." });
          return;
        }

        setSubmissionState({ status: "error", message: payload.result.error.message });
        return;
      }

      setSubmissionState({ status: "error", message: payload.error.message });
    } catch {
      setSubmissionState({
        status: "error",
        message: "We could not process this notice. Please try again.",
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <>
      <NoticeUpload onContinue={onContinue} submissionState={submissionState} />
      {result ? <ResultPreview result={result} /> : null}
    </>
  );
}
