# FORGE AI

**AI-powered mechanical engineering platform.** Upload a sketch, CAD file, or PDF — get back validated structural analysis, design suggestions, and engineering calculations in a single workspace.

---

## What It Does

Engineers typically switch between 5+ tools to go from idea to validated design. FORGE AI collapses that into one intelligent workspace powered by Claude AI, semantic search over engineering documents, and a clean split-screen interface.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (HTML/CSS/JS + React CDN)                     │
│  Split-screen: file viewer ↔ AI chat interface          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (Axios)
┌────────────────────────▼────────────────────────────────┐
│  FastAPI Backend  (main.py)                             │
│  /upload  /query  /health                               │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐  ┌────────────▼───────────────────┐
│  Voyage AI          │  │  Supabase (pgvector)           │
│  voyage-large-2     │  │  documents table               │
│  1,536-dim vectors  │  │  cosine similarity search      │
└─────────────────────┘  └────────────────────────────────┘
                                      │
                         ┌────────────▼───────────────────┐
                         │  Anthropic Claude               │
                         │  claude-sonnet-4-5              │
                         │  RAG-augmented responses        │
                         └────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, uvicorn |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Embeddings | Voyage AI (`voyage-large-2`, 1,536 dims) |
| Database | Supabase with pgvector extension |
| File processing | PyMuPDF |
| Security | slowapi rate limiting, input validation, security headers |
| Frontend | HTML/CSS/JS + React (CDN), Axios |

---

## Project Structure

```
forge-ai/
├── main.py              # FastAPI backend — /upload, /query, /health
├── ingest.py            # PDF ingestion pipeline (chunk → embed → store)
├── search.py            # Semantic search (query → embed → cosine match)
├── requirements.txt
├── .env.example         # Copy to .env and fill in your keys
├── test_pdfs/           # Drop engineering PDFs here for ingestion
└── frontend/
    ├── index.html       # Landing page
    ├── about.html       # About / mission / roadmap
    ├── pricing.html     # Pricing tiers
    ├── app.html         # Split-screen analysis workspace
    └── styles.css       # Shared design system
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/HikmetBisen/ForgeAI.git
cd ForgeAI
pip install -r requirements.txt
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your keys:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
VOYAGE_API_KEY=your_voyage_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Set up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
create extension if not exists vector;

create table if not exists documents (
  id        bigserial primary key,
  content   text,
  metadata  jsonb,
  embedding vector(1536)
);

create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count     int default 5
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language sql stable as $$
  select id, content, metadata,
         1 - (embedding <=> query_embedding) as similarity
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### 4. Ingest engineering PDFs

```bash
python ingest.py test_pdfs/
```

Output: `[beam_handbook.pdf] chunk 3/12 ingested`

### 5. Test semantic search

```bash
python search.py "stress concentration factor for a notched beam"
```

### 6. Start the backend

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 7. Open the frontend

Open `frontend/index.html` in your browser, or open `frontend/app.html` directly for the analysis workspace.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload a PDF for ingestion |
| `POST` | `/query` | Ask a question, get a RAG-augmented answer |

---

## Roadmap

- [x] Phase 1 — RAG pipeline (PDF ingestion, Voyage AI embeddings, pgvector)
- [x] Phase 2 — FastAPI backend with rate limiting and security headers
- [x] Phase 3 — Frontend (marketing site + split-screen analysis workspace)
- [ ] Phase 4 — Guided onboarding (auto-questions on file upload)
- [ ] Phase 5 — Output layer (structured reports, CAD parameter export)
- [ ] Phase 6 — Multi-model routing (LiteLLM — Claude + GPT + Gemini)
- [ ] Phase 7 — Polish and user testing
- [ ] Phase 8 — Monetization

---

## License

MIT
