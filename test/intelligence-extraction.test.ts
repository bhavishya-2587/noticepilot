import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContentMock } = vi.hoisted(() => {
  process.env.GEMINI_API_KEY = "test-key";

  return {
    generateContentMock: vi.fn(),
  };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: generateContentMock,
    };
  },
}));

import type { NormalizedIngestionResult } from "@/lib/ingestion/types";

import { IntelligenceFailure } from "@/lib/intelligence/errors";
import { extractNoticeIntelligence } from "@/lib/intelligence/extraction";

const sourceSegments = [
  {
    segmentId: "notice-page-1",
    text: [
      "Department of Computer Science",
      "Internal Assessment submission must be completed by 25 September 2026.",
      "Students must submit the completed assignment through the department portal before 5:00 PM.",
      "The assessment briefing will be held on 22 September 2026 at 2:00 PM in Room 204.",
      "Students are required to bring their college identity card to the briefing.",
      "Issued by: Department of Computer Science",
    ].join("\n"),
    sourceLocation: {
      sourceType: "pdf" as const,
      pageNumber: 1,
    },
  },
];

const successfulIngestion: NormalizedIngestionResult = {
  status: "success",
  document: {
    documentId: "test-document",
    originalFilename: "notice.pdf",
    mediaType: "application/pdf",
  },
  extractedText: sourceSegments[0].text,
  sourceSegments,
  metadata: {
    pageCount: 1,
  },
};

function createValidResult() {
  return {
    notice: {
      title: "Internal Assessment",
      audience: {
        status: "present",
        value: "B.Sc. Computer Science Semester 1 students",
      },
      summary:
        "Semester 1 students must submit the Internal Assessment assignment by 25 September 2026.",
      issuer: {
        status: "present",
        value: "Department of Computer Science",
      },
    },
    items: [
      {
        type: "deadline",
        title: "Assessment submission",
        description:
          "Students must submit the completed assignment through the department portal before 5:00 PM on 25 September 2026.",
        date: {
          status: "present",
          raw: "25 September 2026",
          normalized: "2026-09-25",
        },
        time: {
          status: "present",
          value: "5:00 PM",
        },
        location: {
          status: "not_specified",
        },
        actionRequired: {
          status: "present",
          value: "required",
        },
        evidence: [
          {
            sourceSegmentId: "notice-page-1",
            quote:
              "Internal Assessment submission must be completed by 25 September 2026.",
          },
          {
            sourceSegmentId: "notice-page-1",
            quote:
              "Students must submit the completed assignment through the department portal before 5:00 PM.",
          },
        ],
      },
      {
        type: "event",
        title: "Assessment briefing",
        description:
          "The assessment briefing will be held on 22 September 2026 at 2:00 PM in Room 204.",
        date: {
          status: "present",
          raw: "22 September 2026",
          normalized: "2026-09-22",
        },
        time: {
          status: "present",
          value: "2:00 PM",
        },
        location: {
          status: "present",
          value: "Room 204",
        },
        actionRequired: {
          status: "present",
          value: "optional",
        },
        evidence: [
          {
            sourceSegmentId: "notice-page-1",
            quote:
              "The assessment briefing will be held on 22 September 2026 at 2:00 PM in Room 204.",
          },
        ],
      },
    ],
  };
}

function mockGeminiResponse(value: unknown): void {
  generateContentMock.mockResolvedValueOnce({
    text: JSON.stringify(value),
  });
}

function mockRawGeminiResponse(text: string): void {
  generateContentMock.mockResolvedValueOnce({
    text,
  });
}

function expectIntelligenceFailure(
  error: unknown,
  code: IntelligenceFailure["code"],
): void {
  expect(error).toBeInstanceOf(IntelligenceFailure);
  expect((error as IntelligenceFailure).code).toBe(code);
}

describe("extractNoticeIntelligence", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
  });

  it("accepts a valid intelligence result with valid evidence", async () => {
    const result = createValidResult();

    mockGeminiResponse(result);

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).resolves.toEqual(result);

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("returns output_invalid when Gemini returns malformed JSON", async () => {
    mockRawGeminiResponse("{ invalid json");

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "output_invalid");
      return true;
    });
  });

  it("returns output_invalid when Gemini returns schema-invalid JSON", async () => {
    mockGeminiResponse({
      notice: {
        title: "Assessment",
        audience: {
          status: "present",
          value: "Students",
        },
        summary: "An assessment notice.",
        issuer: {
          status: "present",
          value: "Department",
        },
      },
      items: [
        {
          type: "deadline",
          title: "Submission",
          description: "Submit the assignment.",
          date: {
            status: "present",
            raw: "25 September 2026",
            normalized: "not-a-date",
          },
          time: {
            status: "not_specified",
          },
          location: {
            status: "not_specified",
          },
          actionRequired: {
            status: "present",
            value: "required",
          },
          evidence: [
            {
              sourceSegmentId: "notice-page-1",
              quote: "Submit the assignment.",
            },
          ],
        },
      ],
    });

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "output_invalid");
      return true;
    });
  });

  it("returns evidence_invalid when evidence references a missing source segment", async () => {
    const result = createValidResult();

    result.items[0].evidence = [
      {
        sourceSegmentId: "missing-segment",
        quote: "Internal Assessment submission must be completed",
      },
    ];

    mockGeminiResponse(result);

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "evidence_invalid");
      return true;
    });
  });

  it("returns evidence_invalid when evidence contains a fabricated quote", async () => {
    const result = createValidResult();

    result.items[0].evidence = [
      {
        sourceSegmentId: "notice-page-1",
        quote: "The assignment must be submitted through WhatsApp.",
      },
    ];

    mockGeminiResponse(result);

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "evidence_invalid");
      return true;
    });
  });

  it("accepts evidence with harmless whitespace variation", async () => {
    const result = createValidResult();

    result.items[0].evidence = [
      {
        sourceSegmentId: "notice-page-1",
        quote:
          "Internal   Assessment submission must be completed by 25 September 2026.",
      },
    ];

    mockGeminiResponse(result);

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).resolves.toEqual(result);
  });

  it("returns input_invalid when ingestion has failed", async () => {
    const failedIngestion: NormalizedIngestionResult = {
      status: "failed",
      document: successfulIngestion.document,
      extractedText: "",
      sourceSegments: [],
      error: {
        code: "text_extraction_failed",
        message: "Text extraction failed.",
      },
    };

    await expect(
      extractNoticeIntelligence(failedIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "input_invalid");
      return true;
    });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("returns input_invalid when ingestion contains no source segments", async () => {
    const emptySegmentsIngestion: NormalizedIngestionResult = {
      status: "success",
      document: successfulIngestion.document,
      extractedText: "",
      sourceSegments: [],
      metadata: {
        pageCount: 1,
      },
    };

    await expect(
      extractNoticeIntelligence(emptySegmentsIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "input_invalid");
      return true;
    });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("returns input_invalid when extracted notice input exceeds the size limit", async () => {
    const oversizedText = "A".repeat(120_001);

    const oversizedIngestion: NormalizedIngestionResult = {
      status: "success",
      document: successfulIngestion.document,
      extractedText: oversizedText,
      sourceSegments: [
        {
          segmentId: "oversized-segment",
          text: oversizedText,
          sourceLocation: {
            sourceType: "pdf",
            pageNumber: 1,
          },
        },
      ],
      metadata: {
        pageCount: 1,
      },
    };

    await expect(
      extractNoticeIntelligence(oversizedIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "input_invalid");
      return true;
    });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("returns provider_unavailable when the Gemini provider fails", async () => {
    generateContentMock.mockRejectedValueOnce(
      new Error("Simulated Gemini provider failure"),
    );

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "provider_unavailable");
      return true;
    });
  });

  it("returns output_invalid when Gemini returns an empty response", async () => {
    generateContentMock.mockResolvedValueOnce({
      text: "",
    });

    await expect(
      extractNoticeIntelligence(successfulIngestion),
    ).rejects.toSatisfy((error: unknown) => {
      expectIntelligenceFailure(error, "output_invalid");
      return true;
    });
  });
});