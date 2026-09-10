# NoticePilot

NoticePilot is an AI-powered academic notice intelligence system.

It turns unstructured academic notices into clear, actionable information while preserving evidence from the original notice.

## Problem

College students often receive important academic information through notices that can be long, inconsistently formatted, or difficult to interpret quickly.

Important deadlines, requirements, events, and actions can be buried inside the document.

NoticePilot aims to reduce the effort required to find and act on this information.

## Project Status

NoticePilot is being developed for GatewayHacks 2026.

The project is currently in the foundation stage. The Next.js application, TypeScript setup, Git workflow, environment-variable convention, and Vercel deployment pipeline are established.

The notice ingestion and AI processing pipeline are intentionally not implemented yet.

## Planned MVP

The MVP will:

- Accept an academic notice as input
- Extract and interpret its contents
- Generate a short, clear title
- Identify who the notice is for
- Summarize important information
- Extract dates, times, venues, deadlines, and events
- Identify the issuer or relevant notice details
- Show missing information explicitly as `Not specified`
- Preserve references to the original notice
- Indicate uncertainty when information is ambiguous
- Present the result through a clean, student-focused interface

The original notice remains the source of truth.

AI-generated information will be treated as an interpretation of that source and will be validated before being used by the application.

## Current Architecture

The planned application flow is:

```text
Student
   ↓
Next.js Frontend
   ↓
Backend / API
   ↓
Text Extraction
   ↓
AI Interpretation
   ↓
Structured JSON
   ↓
Validation
   ↓
Student UI