# NoticePilot

I built NoticePilot because academic notices are usually a mess — a wall of
text where the one deadline that actually matters is buried somewhere in
paragraph three. You upload a notice (a PDF or a photo of one), and it pulls
out the actual actionable stuff: deadlines, tasks, events, who it's for,
who issued it — and for every fact it extracts, it shows you exactly which
line of the original notice that came from. If the AI can't find something,
it says so instead of guessing.

Built solo for GatewayHacks 2026, targeting the **Equity in Education**
track — the idea being that missed or misread notices cost some students
more than others, especially if they don't have someone around to double-
check what a confusing notice actually meant.

## Why the evidence thing matters

Most "AI summarizer" projects just trust the model's output. I didn't want
to build that. Every extracted fact in NoticePilot has to point back to a
real quote from the source document, and I verify that quote actually
exists in the notice before it's ever shown to a user. If the model
hallucinates a deadline or fabricates a quote, that item gets rejected, not
displayed. The notice itself is always the source of truth — the AI's job
is to help you find things in it faster, not to replace reading it.

## How it actually works

```text
Upload (PDF / JPG / PNG)
        ↓
Text extraction
  — PDFs: extracted server-side, page by page
  — Images: OCR runs entirely in the browser (the raw image never
    leaves your device)
        ↓
AI extraction — turns raw text into structured deadlines, tasks, events
        ↓
Schema validation — rejects anything the model returns that doesn't
match the expected shape
        ↓
Evidence verification — every extracted fact must cite a verbatim quote
that actually exists in the source text, or it gets thrown out
        ↓
Result: structured, evidence-linked notice data
```

## What's actually done vs. what's still in progress

I'd rather be upfront here than have someone click around expecting
something that isn't there yet.

**Working right now:**
- Upload + validation for PDF/JPG/JPEG/PNG, 20MB max
- Server-side PDF text extraction, browser-side OCR for images
- AI extraction into a structured schema (title, audience, summary,
  issuer, and a list of items with type/date/time/location/whether
  action is required)
- Every field is explicitly marked `present`, `not_specified`, or
  `uncertain` — nothing gets silently dropped or invented
- Evidence verification — extracted facts are checked against the real
  source text before being trusted
- The notice content is explicitly treated as untrusted data during AI
  processing, not as instructions — so a notice can't try to hijack the
  extraction step
- Automated tests covering ingestion, extraction, and evidence
  verification

**Not done yet:**
- Wiring the extraction results into the actual dashboard UI (right now
  you can verify extraction works through the API and test suite, but
  the polished "upload and see your deadlines" screen isn't finished)
- Calendar export (.ics)

## Why this stack

Next.js + TypeScript + Tailwind for the frontend, Zod for validating
whatever the AI hands back (never trust it raw), Vitest for tests. The
AI extraction runs through Groq rather than Gemini — I originally built
this on Gemini, but hit a Google-side bug where newly issued API keys
were being rejected by their own API (a known, unresolved issue on their
end as of this writing), so I swapped providers rather than lose more
time waiting on a fix. The intelligence layer is written so the actual
LLM call is isolated behind one small module — swapping providers again,
if I ever need to, means changing one file, not the whole pipeline.

No database yet — notices are processed in memory per request and
nothing is persisted. That's a deliberate scope decision for now, not an
oversight.

## Security basics I actually implemented, not just claimed

- Upload type/size restrictions, enforced before any processing
- AI output is untrusted until it passes schema validation *and*
  evidence verification — both have to pass
- API keys are server-side only, never shipped to the browser
- Notices aren't stored longer than the request that processes them

## Try it live

https://noticepilot-seven.vercel.app/ — no setup needed, just upload a notice.

## Running it locally (for reviewing the code)

```bash
npm install
npm run dev
```

You'll need your own `GROQ_API_KEY` in `.env.local` if you want to run
the AI extraction step locally — get a free one at
[console.groq.com](https://console.groq.com/keys). The live deployment
above already has this configured, so this is only needed if you're
cloning the repo yourself.