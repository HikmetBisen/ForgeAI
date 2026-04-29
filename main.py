import base64
import json
import logging
import os

import anthropic
import fitz
import httpx
import uvicorn
import voyageai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

SUPABASE_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

SYSTEM_PROMPT = (
    "You are FORGE AI, an expert mechanical engineering assistant. "
    "Answer using the provided engineering knowledge context. "
    "Always show your reasoning and calculations."
)

ONBOARDING_PROMPT = (
    "You are FORGE AI. Analyze this engineering file and generate exactly 3 smart, "
    "specific questions an engineer should answer before analysis. "
    "Return ONLY a JSON array of 3 question strings. No preamble, no explanation."
)

FALLBACK_QUESTIONS = [
    "What is the primary load case for this component?",
    "What material specification applies to this design?",
    "What is the required safety factor for this application?",
]

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

logging.basicConfig(level=logging.ERROR, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="FORGE AI")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# TODO: restrict to frontend domain before production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Request body exceeds 10 MB limit."})
    return await call_next(request)


class QueryRequest(BaseModel):
    query: str
    file_context: str = ""

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Query must not be empty.")
        if len(v) > 1000:
            raise ValueError("Query must be 1000 characters or fewer.")
        return v


# --- helpers ---

def _rag_search(query: str, match_count: int = 5) -> list[dict]:
    voyage = voyageai.Client(api_key=VOYAGE_API_KEY)
    result = voyage.embed([query], model="voyage-large-2", input_type="query")
    query_embedding = result.embeddings[0]

    response = httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/match_documents",
        headers=SUPABASE_HEADERS,
        json={"query_embedding": query_embedding, "match_count": match_count},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def _build_prompt(query: str, rag_rows: list[dict], file_context: str) -> str:
    sections: list[str] = []

    if rag_rows:
        rag_text = "\n\n".join(
            f"[Source: {r.get('metadata', {}).get('source', 'unknown')} | "
            f"similarity: {r.get('similarity', 0):.4f}]\n{r.get('content', '')}"
            for r in rag_rows
        )
        sections.append(f"## Knowledge Base Context\n{rag_text}")

    if file_context.strip():
        sections.append(f"## Uploaded File Context\n{file_context.strip()}")

    sections.append(f"## Question\n{query}")
    return "\n\n".join(sections)


# --- endpoints ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
@limiter.limit("10/minute")
async def upload(request: Request, file: UploadFile):
    try:
        filename = file.filename or ""
        ext = os.path.splitext(filename.lower())[1]

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Allowed: PDF, PNG, JPG, JPEG.",
            )

        data = await file.read()

        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

        if ext == ".pdf":
            doc = fitz.open(stream=data, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            return {"file_type": "pdf", "content": text}

        encoded = base64.b64encode(data).decode("utf-8")
        return {"file_type": "image", "content": encoded}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong.")


@app.post("/analyze-file")
@limiter.limit("5/minute")
async def analyze_file(request: Request, file: UploadFile):
    """Upload a file, extract its content, and return 3 AI-generated onboarding questions."""
    filename = file.filename or ""
    ext = os.path.splitext(filename.lower())[1]

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: PDF, PNG, JPG, JPEG.",
        )

    try:
        data = await file.read()
    except Exception as e:
        logger.error("File read error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Could not read uploaded file.")

    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

    # ── Extract content from file ──
    try:
        if ext == ".pdf":
            doc = fitz.open(stream=data, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            file_type = "pdf"
            stored_content = text
            # Truncate to 8 000 chars so the onboarding prompt stays cheap
            claude_content = f"Engineering document text:\n\n{text[:8000]}"
        else:
            encoded = base64.b64encode(data).decode("utf-8")
            mime = "image/png" if ext == ".png" else "image/jpeg"
            file_type = "image"
            stored_content = encoded
            claude_content = [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": mime, "data": encoded},
                },
                {
                    "type": "text",
                    "text": "Analyze this engineering file and generate 3 specific questions.",
                },
            ]
    except Exception as e:
        logger.error("File extraction error: %s", e, exc_info=True)
        raise HTTPException(status_code=400, detail="Could not parse the uploaded file.")

    # ── Ask Claude for context-specific questions ──
    questions = FALLBACK_QUESTIONS[:]
    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=512,
            system=ONBOARDING_PROMPT,
            messages=[{"role": "user", "content": claude_content}],
        )
        raw = message.content[0].text.strip()
        parsed = json.loads(raw)
        if isinstance(parsed, list) and parsed:
            questions = [str(q) for q in parsed[:3]]
            # Pad to 3 if Claude returned fewer
            while len(questions) < 3:
                questions.append("What additional context would help the analysis?")
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Onboarding JSON parse failed (%s) — using fallback questions", e)
    except Exception as e:
        logger.error("Claude onboarding error: %s", e, exc_info=True)
        # Non-fatal: return fallback questions so the user can still work

    return {
        "questions": questions,
        "file_type": file_type,
        "content": stored_content,
    }


@app.post("/query")
@limiter.limit("10/minute")
def query(request: Request, req: QueryRequest):
    try:
        rag_rows = _rag_search(req.query)
    except httpx.HTTPStatusError as e:
        logger.error("RAG search failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong.")
    except Exception as e:
        logger.error("RAG search error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong.")

    try:
        prompt = _build_prompt(req.query, rag_rows, req.file_context)

        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        return {"response": message.content[0].text}

    except Exception as e:
        logger.error("Claude API error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong.")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
