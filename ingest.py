import os
import sys
import glob
import time
import fitz
import httpx
import voyageai
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
STEP = CHUNK_SIZE - CHUNK_OVERLAP

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def extract_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    return "\n".join(page.get_text() for page in doc)


def chunk_text(text: str) -> list[str]:
    words = text.split()
    return [
        " ".join(words[i : i + CHUNK_SIZE])
        for i in range(0, len(words), STEP)
        if words[i : i + CHUNK_SIZE]
    ]


def ingest_folder(folder_path: str) -> None:
    voyage = voyageai.Client(api_key=VOYAGE_API_KEY)

    pdf_files = sorted(glob.glob(os.path.join(folder_path, "*.pdf")))
    if not pdf_files:
        print(f"No PDFs found in {folder_path}")
        return

    with httpx.Client(timeout=30) as client:
        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            print(f"\n[{filename}] Extracting text...")
            text = extract_text(pdf_path)

            if not text.strip():
                print(f"[{filename}] No text extracted, skipping.")
                continue

            chunks = chunk_text(text)
            total = len(chunks)
            print(f"[{filename}] {total} chunks to ingest")

            for i, chunk in enumerate(chunks, start=1):
                result = voyage.embed([chunk], model="voyage-large-2", input_type="document")
                embedding = result.embeddings[0]
                time.sleep(20)

                response = client.post(
                    f"{SUPABASE_URL}/rest/v1/documents",
                    headers=HEADERS,
                    json={
                        "content": chunk,
                        "metadata": {
                            "source": filename,
                            "chunk_index": i,
                            "total_chunks": total,
                        },
                        "embedding": embedding,
                    },
                )
                response.raise_for_status()

                print(f"[{filename}] chunk {i}/{total} ingested")

    print("\nIngestion complete.")


if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else "test_pdfs"
    ingest_folder(folder)
