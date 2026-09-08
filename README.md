# NoticePilot

NoticePilot is an AI-powered academic notice intelligence system.

It turns unstructured academic notices into clear, actionable information while preserving evidence from the original notice.

## Problem

College students often receive important academic information through notices that can be long, inconsistently formatted, or difficult to interpret quickly.

Important deadlines, requirements, events, and actions can be buried inside the document.

NoticePilot aims to reduce the effort required to find and act on this information.

## MVP

The first version of NoticePilot will:

- Accept an academic notice as input
- Extract and interpret its contents
- Generate a short, clear title
- Identify who the notice is for
- Summarize the important information
- Extract dates, times, venues, deadlines, and events
- Identify the issuer or relevant notice details
- Show missing information explicitly as `Not specified`
- Preserve references to the original notice
- Indicate uncertainty when information is ambiguous
- Present the result through a clean, student-focused interface

The original notice remains the source of truth.

AI-generated information is treated as an interpretation of that source.

## Architecture

```text
Student
   ↓
Frontend
   ↓
Backend
   ↓
Text Extraction
   ↓
AI Interpretation
   ↓
Structured Notice Data
   ↓
Validation
   ↓
Student UI