import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractPdfText } from "@/lib/ingestion/pdf-extractor";
import type { DocumentIdentity } from "@/lib/ingestion/types";
import { extractNoticeIntelligence } from "@/lib/intelligence/extraction";

const EVALUATION_NOTICE_PATH = path.join(
  process.cwd(),
  "evaluation",
  "notices",
  "01-internal-assessment.pdf",
);

async function loadEvaluationNotice() {
  const contents = await readFile(EVALUATION_NOTICE_PATH);

  const file = new File([contents], "01-internal-assessment.pdf", {
    type: "application/pdf",
  });

  const document: DocumentIdentity = {
    documentId: "real-evaluation-01",
    originalFilename: file.name,
    mediaType: "application/pdf",
  };

  return {
    data: await file.arrayBuffer(),
    document,
  };
}

describe("real intelligence evaluation", () => {
  it(
    "extracts and verifies intelligence from the internal assessment notice",
    async () => {
      const { data, document } = await loadEvaluationNotice();

      const ingestionResult = await extractPdfText(data, document);

      expect(ingestionResult.status).toBe("success");

      if (ingestionResult.status !== "success") {
        const failureMessage =
          "error" in ingestionResult
            ? ingestionResult.error.message
            : "The evaluation notice produced no extracted content.";

        throw new Error(
          `Evaluation notice ingestion failed: ${failureMessage}`,
        );
      }

      expect(ingestionResult.sourceSegments.length).toBeGreaterThan(0);

      const intelligenceResult =
        await extractNoticeIntelligence(ingestionResult);

      expect(intelligenceResult.notice.title.length).toBeGreaterThan(0);
      expect(intelligenceResult.notice.summary.length).toBeGreaterThan(0);
      expect(intelligenceResult.items.length).toBeGreaterThan(0);

      for (const item of intelligenceResult.items) {
        expect(item.evidence.length).toBeGreaterThan(0);

        for (const evidence of item.evidence) {
          expect(evidence.sourceSegmentId.length).toBeGreaterThan(0);
          expect(evidence.quote.length).toBeGreaterThan(0);
        }
      }

      console.log(
        "\nREAL GROQ EVALUATION RESULT:\n",
        JSON.stringify(intelligenceResult, null, 2),
      );
    },
    60_000,
  );
});