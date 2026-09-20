import "server-only";

import type {
  NormalizedIngestionResult,
  SourceSegment,
} from "@/lib/ingestion/types";

import type {
  Evidence,
  IntelligenceResult,
  NoticeItem,
} from "./schema";

export class EvidenceVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceVerificationError";
  }
}

export interface VerifiedEvidence {
  evidence: Evidence;
  sourceSegment: SourceSegment;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildSourceSegmentMap(
  ingestionResult: NormalizedIngestionResult,
): Map<string, SourceSegment> {
  if (ingestionResult.status !== "success") {
    throw new EvidenceVerificationError(
      `Evidence verification requires successful ingestion. Received status "${ingestionResult.status}".`,
    );
  }

  const segmentMap = new Map<string, SourceSegment>();

  for (const segment of ingestionResult.sourceSegments) {
    if (segmentMap.has(segment.segmentId)) {
      throw new EvidenceVerificationError(
        `Duplicate source segment ID detected: "${segment.segmentId}".`,
      );
    }

    segmentMap.set(segment.segmentId, segment);
  }

  return segmentMap;
}

function verifySingleEvidence(
  evidence: Evidence,
  sourceSegmentMap: Map<string, SourceSegment>,
): VerifiedEvidence {
  const sourceSegment = sourceSegmentMap.get(evidence.sourceSegmentId);

  if (!sourceSegment) {
    throw new EvidenceVerificationError(
      `Evidence references a source segment that does not exist: "${evidence.sourceSegmentId}".`,
    );
  }

  const normalizedQuote = normalizeWhitespace(evidence.quote);
  const normalizedSourceText = normalizeWhitespace(sourceSegment.text);

  if (!normalizedQuote) {
    throw new EvidenceVerificationError(
      `Evidence for source segment "${evidence.sourceSegmentId}" contains an empty quote.`,
    );
  }

  if (!normalizedSourceText.includes(normalizedQuote)) {
    throw new EvidenceVerificationError(
      `Evidence quote was not found in source segment "${evidence.sourceSegmentId}".`,
    );
  }

  return {
    evidence,
    sourceSegment,
  };
}

function verifyNoticeItemEvidence(
  item: NoticeItem,
  sourceSegmentMap: Map<string, SourceSegment>,
): void {
  for (const evidence of item.evidence) {
    verifySingleEvidence(evidence, sourceSegmentMap);
  }
}

export function verifyIntelligenceEvidence(
  intelligenceResult: IntelligenceResult,
  ingestionResult: NormalizedIngestionResult,
): IntelligenceResult {
  const sourceSegmentMap = buildSourceSegmentMap(ingestionResult);

  for (const item of intelligenceResult.items) {
    verifyNoticeItemEvidence(item, sourceSegmentMap);
  }

  return intelligenceResult;
}