# FORGE AI

**One Line:** AI-powered mechanical engineering platform that takes sketches, CAD files, and text — and returns validated structural analysis, design suggestions, and engineering calculations.

## The Problem
Engineers switch between 5+ tools to go from idea to validated design. FORGE AI collapses that into one intelligent workspace.

## The Vision
Be the AI layer between an engineer's mind and their final design.

---

## What's Built

- **Phase 1: RAG pipeline** — PDFs ingested, vectorized with Voyage AI, stored in Supabase pgvector, semantic search working
- **Phase 2: FastAPI backend** — `/upload`, `/query`, `/health` endpoints, secured with rate limiting, input validation, security headers

## What's Left

- **Phase 3: React frontend** — split screen UI, drag and drop upload, chat interface
- **Phase 4: Guided onboarding** — auto questions on file upload, context assembly
- **Phase 5: Output layer** — structured reports, file annotations, CAD parameter export
- **Phase 6: Multi-model routing** — LiteLLM, Claude + GPT + Gemini switching
- **Phase 7: Polish and user testing**
- **Phase 8: Monetization**

---

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Python, FastAPI, uvicorn |
| AI | Anthropic Claude (`claude-sonnet-4-5`), Voyage AI embeddings |
| Database | Supabase with pgvector |
| File processing | PyMuPDF, httpx |
| Security | slowapi rate limiting, input validation, security headers |
| Frontend (upcoming) | React, Three.js, React-PDF |

---

## Key Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI backend server |
| `ingest.py` | PDF ingestion pipeline |
| `search.py` | RAG semantic search |
| `.env` | API keys — **never commit** |

---

## Core Design Principles

- **Split screen workspace** — engineer never loses sight of their file
- **Guided onboarding** — AI asks smart questions on every upload
- **Shown work** — every calculation shows its reasoning
- **Model agnostic** — engineers choose Claude, GPT, or Gemini
- **Built by an engineer, for engineers**
