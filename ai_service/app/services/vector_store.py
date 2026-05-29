from app.core.config import settings


class VectorStore:
    async def search(self, query: str) -> list[dict]:
        if not settings.VECTOR_DB_ENABLED:
            return []

        return [
            {
                "title": "Example knowledge result",
                "content": f"Relevant context for: {query}",
                "score": 0.82,
            }
        ]
