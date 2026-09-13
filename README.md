# NoticePilot

NoticePilot is an academic notice intelligence system for turning unstructured
academic notices into clear, actionable information while preserving source
evidence.

## Project Status

NoticePilot is being developed for GatewayHacks 2026.

Stage 3, Notice Ingestion, is complete. The application validates PDF, JPG,
JPEG, and PNG uploads, extracts PDF text on the server, and performs image OCR
in the browser. Stage 4 AI interpretation is intentionally not implemented.

## Stage 3 Architecture

```text
Student
   ↓
Next.js Frontend
   ├─ PDF → /api/notices/ingest → unpdf → normalized result
   └─ JPG/JPEG/PNG → browser Tesseract.js → normalized result
```

Uploads are limited to 20 MB. Notices are processed in memory and are not
persisted. Browser OCR keeps images in the browser; the server receives PDF
uploads only. PDF source segments identify page numbers. Image OCR identifies
the source as `image` and preserves confidence when Tesseract provides it.

## Planned MVP

Future stages may interpret extracted notice text, identify deadlines and
actions, and present structured information. The original notice remains the
source of truth. AI interpretation is outside Stage 3.
