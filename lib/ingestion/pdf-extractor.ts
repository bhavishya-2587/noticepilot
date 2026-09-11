import { getDocumentProxy } from "unpdf";
import type { PDFPageProxy } from "unpdf/pdfjs";

import type {
  DocumentIdentity,
  NormalizedIngestionResult,
  SourceSegment,
} from "./types";

export type PdfData = ArrayBuffer | Uint8Array;

export const MAX_PDF_PAGES = 100;

function createPageSegment(
  documentId: string,
  pageNumber: number,
  pageText: string,
): SourceSegment {
  return {
    segmentId: `${documentId}-page-${pageNumber}`,
    text: pageText,
    sourceLocation: {
      sourceType: "pdf",
      pageNumber,
    },
  };
}

function createFailureResult(
  document: DocumentIdentity,
  code:
    | "document_unreadable"
    | "text_extraction_failed"
    | "page_limit_exceeded",
  error: unknown,
): NormalizedIngestionResult {
  return {
    status: "failed",
    document,
    extractedText: "",
    sourceSegments: [],
    error: {
      code,
      message:
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "The PDF could not be read.",
    },
  };
}

function getPageText(items: unknown[]): string {
  return items
    .reduce<string>((text, item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "str" in item &&
        typeof item.str === "string"
      ) {
        const hasLineBreak = "hasEOL" in item && item.hasEOL === true;
        return `${text}${item.str}${hasLineBreak ? "\n" : ""}`;
      }

      return text;
    }, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]*/g, "\n")
    .trim();
}

export async function extractPdfText(
  data: PdfData,
  document: DocumentIdentity,
): Promise<NormalizedIngestionResult> {
  const pdfData = data instanceof Uint8Array ? data : new Uint8Array(data);
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;

  try {
    try {
      pdf = await getDocumentProxy(pdfData);
    } catch (error) {
      return createFailureResult(document, "document_unreadable", error);
    }

    const totalPages = pdf.numPages;

    if (totalPages > MAX_PDF_PAGES) {
      return createFailureResult(
        document,
        "page_limit_exceeded",
        `PDF exceeds the ${MAX_PDF_PAGES}-page limit.`,
      );
    }

    const sourceSegments: SourceSegment[] = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      let page: PDFPageProxy | undefined;

      try {
        page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = getPageText(textContent.items);

        if (pageText.length > 0) {
          sourceSegments.push(
            createPageSegment(document.documentId, pageNumber, pageText),
          );
        }
      } catch (error) {
        return createFailureResult(document, "text_extraction_failed", error);
      } finally {
        page?.cleanup();
      }
    }

    if (sourceSegments.length === 0) {
      return {
        status: "empty",
        document,
        extractedText: "",
        sourceSegments: [],
        metadata: { pageCount: totalPages },
      };
    }

    return {
      status: "success",
      document,
      extractedText: sourceSegments.map((segment) => segment.text).join("\n\n"),
      sourceSegments,
      metadata: { pageCount: totalPages },
    };
  } finally {
    if (pdf) {
      await pdf.cleanup();
    }
  }
}
