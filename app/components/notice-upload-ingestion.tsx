"use client";

import { useRef, useState } from "react";

import {
  validateIntelligenceResult,
  type IntelligenceResult,
} from "@/lib/intelligence/schema";
import type { NoticeIngestionResponse } from "@/lib/ingestion/ingestion-response";
import { validateUpload } from "@/lib/ingestion/upload-validator";
import type {
  DocumentIdentity,
  NormalizedIngestionResult,
  SourceLocation,
} from "@/lib/ingestion/types";

import { IntelligenceResultSkeleton } from "./intelligence-result-skeleton";
import { IntelligenceResultView } from "./intelligence-result-view";
import {
  NoticeUpload,
  type NoticeUploadSubmissionState,
} from "./notice-upload";

function isIngestionResponse(
  value: unknown,
): value is NoticeIngestionResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    ("result" in value || "error" in value)
  );
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

async function fetchIntelligence(
  result: NormalizedIngestionResult,
): Promise<IntelligenceResult | null> {
  try {
    const response = await fetch("/api/notices/intelligence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ result }),
    });

    const payload: unknown = await response.json();

    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("result" in payload)
    ) {
      return null;
    }

    const validation = validateIntelligenceResult(payload.result);

    return validation.success ? validation.data : null;
  } catch {
    return null;
  }
}

function ResultPreview({
  result,
}: {
  result: NormalizedIngestionResult;
}) {
  if (result.status === "empty") {
    return (
      <section
        className="rounded-3xl border border-cyan-200/15 bg-gradient-to-br from-[#0b1b2d] to-[#050c17] p-5 text-white shadow-xl shadow-cyan-950/20"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-200">
            ?
          </span>

          <div>
            <h2 className="text-xl font-semibold">
              No readable text found
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              The notice was processed, but no extractable text was found.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (result.status !== "success") {
    return null;
  }

  return (
    <details
      open
      className="group rounded-3xl border border-cyan-200/15 bg-gradient-to-br from-[#0b1b2d] to-[#050c17] text-white shadow-xl shadow-cyan-950/20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
            Source text
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Extracted text
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {result.document.originalFilename} ·{" "}
            {result.document.mediaType}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
            Text extracted
          </span>

          <span className="text-xl text-cyan-200 transition-transform group-open:rotate-180">
            ⌄
          </span>
        </div>
      </summary>

      <div className="border-t border-white/10 p-5 sm:p-6">
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-300">
          {result.extractedText}
        </pre>

        {result.sourceSegments.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-cyan-100">
              Source locations
            </h3>

            <ul className="mt-3 flex flex-wrap gap-2">
              {result.sourceSegments.map((segment) => (
                <li
                  key={segment.segmentId}
                  className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1.5 text-xs text-cyan-100/80"
                >
                  {sourceLabel(segment.sourceLocation)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function NoticeUploadIngestion() {
  const [submissionState, setSubmissionState] =
    useState<NoticeUploadSubmissionState>({
      status: "idle",
    });

  const [result, setResult] =
    useState<NormalizedIngestionResult | null>(null);

  const [intelligence, setIntelligence] =
    useState<IntelligenceResult | null>(null);

  const [intelligenceStatus, setIntelligenceStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const isSubmittingRef = useRef(false);

  const hasWorkspace =
    result !== null ||
    intelligence !== null ||
    intelligenceStatus !== "idle";

  async function onContinue(file: File) {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setResult(null);
    setIntelligence(null);
    setIntelligenceStatus("idle");
    setSubmissionState({
      status: "processing",
      message: "Processing your notice…",
    });

    try {
      const validation = validateUpload(file);

      if (!validation.valid) {
        setSubmissionState({
          status: "error",
          message:
            validation.errors[0]?.message ??
            "The file could not be processed.",
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

        if (
          imageResult.status === "success" ||
          imageResult.status === "empty"
        ) {
          setResult(imageResult);
          setSubmissionState({
            status: "success",
            message:
              imageResult.status === "success"
                ? "Text extracted successfully."
                : "Notice processed.",
          });

          if (imageResult.status === "success") {
            setIntelligenceStatus("loading");

            const intelligenceResult =
              await fetchIntelligence(imageResult);

            if (intelligenceResult) {
              setIntelligence(intelligenceResult);
              setIntelligenceStatus("idle");
            } else {
              setIntelligenceStatus("error");
            }
          }
        } else {
          setSubmissionState({
            status: "error",
            message: imageResult.error.message,
          });
        }

        return;
      }

      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/notices/ingest", {
        method: "POST",
        body: formData,
      });

      const payload: unknown = await response.json();

      if (!isIngestionResponse(payload)) {
        throw new Error("Unexpected response");
      }

      if ("result" in payload) {
        if (payload.result.status === "success") {
          setResult(payload.result);
          setSubmissionState({
            status: "success",
            message: "Text extracted successfully.",
          });

          setIntelligenceStatus("loading");

          const intelligenceResult = await fetchIntelligence(
            payload.result,
          );

          if (intelligenceResult) {
            setIntelligence(intelligenceResult);
            setIntelligenceStatus("idle");
          } else {
            setIntelligenceStatus("error");
          }

          return;
        }

        if (payload.result.status === "empty") {
          setResult(payload.result);
          setSubmissionState({
            status: "success",
            message: "Notice processed.",
          });
          return;
        }

        setSubmissionState({
          status: "error",
          message: payload.result.error.message,
        });
        return;
      }

      setSubmissionState({
        status: "error",
        message: payload.error.message,
      });
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
    <div
      className={
        hasWorkspace
          ? "grid items-start gap-6 lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)]"
          : "mx-auto max-w-xl"
      }
    >
      <aside className={hasWorkspace ? "lg:sticky lg:top-6" : ""}>
        <NoticeUpload
          onContinue={onContinue}
          submissionState={submissionState}
          className={hasWorkspace ? "max-w-none" : "mx-auto"}
        />
      </aside>

      <div className="min-w-0 space-y-6">
        {intelligenceStatus === "loading" ? (
          <IntelligenceResultSkeleton />
        ) : null}

        {intelligenceStatus === "error" ? (
          <section
            className="rounded-3xl border border-amber-200/30 bg-[#21170b] p-6 text-amber-100 shadow-xl shadow-amber-950/20"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-300/10">
                !
              </span>

              <div>
                <h2 className="font-semibold">
                  Structure could not be created
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-100/75">
                  We extracted the text, but could not organize the notice.
                  You can try uploading it again.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {intelligence ? (
          <IntelligenceResultView intelligence={intelligence} />
        ) : null}

        {result ? <ResultPreview result={result} /> : null}
      </div>
    </div>
  );
}