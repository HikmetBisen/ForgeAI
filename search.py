import os
import sys
import voyageai
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]


def search(query: str, match_count: int = 5) -> None:
    voyage = voyageai.Client(api_key=VOYAGE_API_KEY)
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    print(f'Query: "{query}"\n')

    result = voyage.embed([query], model="voyage-large-2", input_type="query")
    query_embedding = result.embeddings[0]

    response = supabase.rpc(
        "match_documents",
        {"query_embedding": query_embedding, "match_count": match_count},
    ).execute()

    rows = response.data
    if not rows:
        print("No results found.")
        return

    for rank, row in enumerate(rows, start=1):
        source = row.get("metadata", {}).get("source", "unknown")
        chunk_idx = row.get("metadata", {}).get("chunk_index", "?")
        total = row.get("metadata", {}).get("total_chunks", "?")
        similarity = row.get("similarity", 0)
        preview = row.get("content", "")[:200].replace("\n", " ")

        print(f"[{rank}] {source} (chunk {chunk_idx}/{total}) — similarity: {similarity:.4f}")
        print(f"    {preview}...")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python search.py \"your query here\"")
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    search(query)
