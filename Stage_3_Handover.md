# Stage 3 Handover

## Stage Status

- Stage: 3, Notice Ingestion
- Status: Complete
- Completion date: 2026-09-13

## Starting State

Stage 2 supplied the Next.js application, upload UI, Vercel deployment, and
TypeScript/Vitest workflow. Stage 3 began with PDF extraction working and image
OCR using a Tesseract.js Node worker. The Node worker worked locally but failed
in Vercel because its CommonJS dependency tree was not reliably included in
the serverless bundle.

## Ingestion Scope

Supported formats are PDF, JPG, JPEG, and PNG. The 20 MB limit applies to every
upload. Other extensions, MIME types, empty files, oversized files, and
extension/MIME mismatches are rejected.

## Upload Flow

The upload component validates the selected browser `File` for immediate UX
feedback. The authoritative validator runs before any server extraction or
browser OCR.

- PDFs are sent as multipart form data to `/api/notices/ingest`.
- The Node.js route validates the upload, reads it in memory, and extracts text
  with `unpdf`.
- JPG/JPEG/PNG files stay in the browser and use the browser Tesseract build.
- Results are displayed through the same normalized result states.
- Users can remove a file or process another notice after completion.

## Extraction System

- PDF extraction uses `unpdf`, sequential page processing, a 100-page maximum,
  page cleanup, and document cleanup.
- Image OCR uses `tesseract.js/dist/tesseract.min.js`, the self-contained
  browser bundle, with English (`eng`) trained data.
- Browser OCR converts a `Blob`/`File` to a temporary object URL, passes that
  URL to Tesseract, revokes it in `finally`, and terminates the worker in
  `finally`.
- The server never imports or invokes the Tesseract Node worker.

## Internal Data Representation

`NormalizedIngestionResult` distinguishes `success`, `empty`, `failed`, and
validation failure. Results preserve document identity, extracted text, source
segments, media type, optional metadata, and optional OCR confidence.

## Source Locations

- PDFs use `{ sourceType: "pdf", pageNumber }`.
- Images use `{ sourceType: "image" }`.
- No image bounding boxes are fabricated.
- OCR confidence is preserved when returned by Tesseract.

## Project Structure

- `lib/ingestion/types.ts`: shared normalized result and upload types.
- `lib/ingestion/upload-validator.ts`: authoritative upload validation.
- `lib/ingestion/pdf-extractor.ts`: bounded PDF extraction and provenance.
- `lib/ingestion/image-ocr-extractor.ts`: browser OCR boundary and cleanup.
- `lib/ingestion/ingest-notice.ts`: server orchestration and safe image fallback.
- `app/api/notices/ingest/route.ts`: multipart PDF API boundary.
- `app/components/notice-upload.tsx`: upload UI and client validation.
- `app/components/notice-upload-ingestion.tsx`: PDF and browser OCR flows.
- `lib/ingestion/tesseract-browser.d.ts`: browser bundle declaration.

## Security

- Files are treated as untrusted input.
- Size, empty-file, media-type, extension, and mismatch checks run server-side
  for API requests and client-side for UX.
- Filenames are displayed as text and never used as filesystem paths.
- PDF processing is capped at 100 pages and resources are cleaned up.
- OCR workers and object URLs are cleaned up even when recognition fails.
- Internal dependency errors are replaced with safe user-facing messages.
- Direct server-side image ingestion returns structured `ocr_failed`.

## Privacy

Notices are not persisted and are processed in memory. PDFs are transmitted to
the application's ingestion route because server-side PDF extraction is
required. Images are not sent to that route during normal use; browser OCR
keeps the selected image local to the browser. Temporary object URLs are
revoked after recognition. Browser cache behavior for Tesseract runtime assets
is the remaining privacy consideration.

## Error Handling

Validation failures return structured validation errors and HTTP 400. PDF
extraction failures return HTTP 422 with safe messages. Unexpected route
failures return a generic HTTP 500 response. Empty documents are valid `empty`
results. Browser OCR failures show a generic OCR failure message.

## Testing

Validation, PDF extraction, page limits, malformed PDFs, OCR result states,
worker termination, source provenance, confidence, upload UI behavior, browser
image routing, and PDF API routing are covered by Vitest.

Commands run:

- `npm test`: 45 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Focused OCR/upload tests: passed.
- Production bundle inspection: no Node worker references.

## Deployment

The production target is `https://noticepilot-seven.vercel.app`. The route
remains explicitly Node.js because PDF extraction uses server-side Node
execution. After pushing commit `9d03828`, the production page loaded and the
multipart API returned the expected generic invalid-request response for a
request without form data. The browser automation environment could not access
the local Linux fixture path, so live PDF/image upload extraction was not
claimed; those paths are covered by the local extraction and browser-boundary
tests.

## Git

- Branch: `main`
- Commits: `9d03828` (`complete stage 3 notice ingestion`)
- Push status: pushed to `origin/main`
- Final working-tree status: clean after the follow-up documentation commit

## Problems and Fixes

The original server image OCR used Tesseract.js `createWorker`. Vercel could
not reliably resolve its internal CommonJS worker dependency graph. The fix
moves image OCR to the self-contained browser build and removes server
Tesseract bundling configuration. PDF extraction remains server-side.

## Decisions

- Keep PDF, JPG, JPEG, and PNG only.
- Keep PDF extraction server-side.
- Keep image OCR browser-side for Vercel compatibility and privacy.
- Keep no persistence, database, authentication, or external OCR service.
- Do not solve the worker issue with individual dependency tracing.

## Known Limitations

- Image OCR supports English only.
- Browser OCR performance depends on the user's device and first-use network.
- Image provenance is document-level rather than region-level.
- PDF image-only pages remain `empty`; Stage 3 does not add PDF OCR.

## Stage 4 Starting Point

Stage 4 can consume `NormalizedIngestionResult` without changing the ingestion
boundary. It must not assume every result has text, that image locations have
bounding boxes, or that uploaded documents are persisted. The recommended
first task is interpretation around the normalized result while preserving
source evidence.

## Stage 3 Completion Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Supported formats | Complete | Validator and upload tests |
| Upload constraints | Complete | 20 MB, empty, type, extension, mismatch tests |
| Upload UI | Complete | `notice-upload.test.tsx` |
| Client/server validation | Complete | Client UX and authoritative server validator |
| PDF extraction | Complete | PDF, malformed, empty, limit, and e2e tests |
| Browser image OCR | Complete | OCR boundary and browser upload tests |
| Source locations | Complete | PDF page and image provenance assertions |
| Normalized result | Complete | Shared `NormalizedIngestionResult` |
| Empty/failure handling | Complete | PDF, OCR, route, and UI tests |
| Security/privacy review | Complete | Limits, cleanup, safe errors, no persistence |
| Documentation | Complete | README and this handover |
| Build/lint/tests | Complete | 45 tests passed; lint and build passed |
| Vercel worker compatibility | Complete | Server bundle inspection |
| Production verification | Partial | Live page/API checked; live file upload unavailable in browser harness |
| Git commit/push | Complete | Commit pushed to `origin/main` |
