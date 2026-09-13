// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NoticeUpload } from "@/app/components/notice-upload";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/ingestion/types";

afterEach(cleanup);

function createFile(name: string, type: string, contents: BlobPart = "notice") {
  return new File([contents], name, { type });
}

describe("NoticeUpload", () => {
  it("shows a selected valid PDF and its basic information", async () => {
    const user = userEvent.setup();
    render(<NoticeUpload />);

    await user.upload(screen.getByLabelText("Choose a notice file"), createFile("exam-schedule.pdf", "application/pdf"));

    expect(screen.getByText("exam-schedule.pdf")).toBeTruthy();
    expect(screen.getByText(/application\/pdf/)).toBeTruthy();
  });

  it.each([
    ["notice.jpg", "image/jpeg"],
    ["notice.png", "image/png"],
  ])("accepts a valid %s image", async (name, type) => {
    const user = userEvent.setup();
    render(<NoticeUpload />);

    await user.upload(screen.getByLabelText("Choose a notice file"), createFile(name, type));

    expect(screen.getByText(name)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects an unsupported file type", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<NoticeUpload />);

    await user.upload(screen.getByLabelText("Choose a notice file"), createFile("notice.txt", "text/plain"));

    expect(screen.getByRole("alert").textContent).toContain("PDF, JPG, JPEG, or PNG");
  });

  it("rejects a file larger than 20 MB", async () => {
    const user = userEvent.setup();
    render(<NoticeUpload />);
    const largeFile = createFile("large.pdf", "application/pdf", new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1));

    await user.upload(screen.getByLabelText("Choose a notice file"), largeFile);

    expect(screen.getByRole("alert").textContent).toContain("no larger than 20 MB");
  });

  it("removes a file and allows it to be replaced", async () => {
    const user = userEvent.setup();
    render(<NoticeUpload />);
    const input = screen.getByLabelText("Choose a notice file");

    await user.upload(input, createFile("first.pdf", "application/pdf"));
    await user.click(screen.getByRole("button", { name: "Remove file" }));
    expect(screen.queryByText("first.pdf")).toBeNull();

    await user.upload(input, createFile("second.png", "image/png"));
    expect(screen.getByText("second.png")).toBeTruthy();
  });

  it("passes the selected File to the continue callback", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const file = createFile("notice.pdf", "application/pdf");
    render(<NoticeUpload onContinue={onContinue} />);

    await user.upload(screen.getByLabelText("Choose a notice file"), file);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledWith(file);
  });

  it("allows another notice after a successful submission", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(
      <NoticeUpload
        onContinue={onContinue}
        submissionState={{ status: "success", message: "Processed." }}
      />,
    );

    const input = screen.getByLabelText("Choose a notice file");
    await user.upload(input, createFile("next-notice.png", "image/png"));

    expect(screen.getByText("next-notice.png")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("lets keyboard users activate the drop zone and reach the file input", () => {
    render(<NoticeUpload />);
    const input = screen.getByLabelText("Choose a notice file");

    fireEvent.keyDown(screen.getByRole("button", { name: /drag and drop/i }), { key: "Enter" });

    expect(document.activeElement).toBe(input);
  });
});
