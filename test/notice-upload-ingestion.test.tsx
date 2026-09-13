// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { extractImageText } = vi.hoisted(() => ({
  extractImageText: vi.fn(),
}));

vi.mock("@/lib/ingestion/image-ocr-extractor", () => ({ extractImageText }));

import { NoticeUploadIngestion } from "@/app/components/notice-upload-ingestion";

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function createFile() {
  return new File(["notice"], "notice.pdf", { type: "application/pdf" });
}

function createImageFile() {
  return new File(["notice image"], "notice.png", { type: "image/png" });
}

async function selectFile(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText("Choose a notice file"), createFile());
}

describe("NoticeUploadIngestion", () => {
  afterEach(() => {
    extractImageText.mockReset();
  });

  it("enters processing and submits the selected File to the ingestion boundary", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn<FetchMock>(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await selectFile(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Preparing your notice…")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Preparing notice…" }) as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/notices/ingest", expect.objectContaining({ method: "POST" }));
    const request = fetchMock.mock.calls[0]?.[1];
    expect(request).toBeDefined();
    if (!request) throw new Error("Expected a fetch request");
    expect((request.body as FormData).get("file")).toBeInstanceOf(File);

    resolveFetch?.(Response.json({ result: {
      status: "empty",
      document: { documentId: "empty", originalFilename: "notice.pdf", mediaType: "application/pdf" },
      extractedText: "",
      sourceSegments: [],
    } }));
    await screen.findByText("No readable text found");
  });

  it("displays extracted text and PDF source pages after a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: {
      status: "success",
      document: { documentId: "pdf-1", originalFilename: "notice.pdf", mediaType: "application/pdf" },
      extractedText: "Exam schedule",
      sourceSegments: [{
        segmentId: "pdf-1-page-2",
        text: "Exam schedule",
        sourceLocation: { sourceType: "pdf", pageNumber: 2 },
      }],
    } })));
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await selectFile(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Extracted text")).toBeTruthy();
    expect(screen.getByText("Exam schedule")).toBeTruthy();
    expect(screen.getByText("Page 2")).toBeTruthy();
  });

  it("displays a readable-but-empty result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: {
      status: "empty",
      document: { documentId: "empty", originalFilename: "notice.pdf", mediaType: "application/pdf" },
      extractedText: "",
      sourceSegments: [],
    } })));
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await selectFile(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("No readable text found")).toBeTruthy();
  });

  it("displays an ingestion validation error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: {
      status: "failed",
      extractedText: "",
      sourceSegments: [],
      error: { code: "empty_file", message: "The file is empty." },
      validationErrors: [{ code: "empty_file", message: "The file is empty." }],
    } })));
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await selectFile(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect((await screen.findByRole("alert")).textContent).toContain("The file is empty.");
  });

  it("runs image OCR in the browser without uploading the image to the server", async () => {
    extractImageText.mockResolvedValueOnce({
      status: "success",
      document: {
        documentId: "image-1",
        originalFilename: "notice.png",
        mediaType: "image/png",
      },
      extractedText: "Image notice",
      sourceSegments: [
        {
          segmentId: "image-1-image",
          text: "Image notice",
          sourceLocation: { sourceType: "image" },
          ocrConfidence: 96,
        },
      ],
    });
    const fetchMock = vi.fn<FetchMock>();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await user.upload(
      screen.getByLabelText("Choose a notice file"),
      createImageFile(),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Image notice")).toBeTruthy();
    expect(extractImageText).toHaveBeenCalledOnce();
    expect(extractImageText).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        originalFilename: "notice.png",
        mediaType: "image/png",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prevents duplicate Continue actions while processing", async () => {
    const fetchMock = vi.fn<FetchMock>(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<NoticeUploadIngestion />);

    await selectFile(user);
    const continueButton = screen.getByRole("button", { name: "Continue" });
    await user.click(continueButton);
    await user.click(screen.getByRole("button", { name: "Preparing notice…" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });
});
