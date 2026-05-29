from app.models.schemas import IntentResult, LlmResult


class LlmService:
    async def generate_response(
        self,
        transcript: str,
        intent: IntentResult,
        context: list[dict],
    ) -> LlmResult:
        response = (
            f"I understood your request as {intent.name}. "
            "Here is a helpful voice response from the assistant."
        )

        return LlmResult(
            text=response,
            data={
                "provider": "mock",
                "transcript_length": len(transcript),
                "context_count": len(context),
            },
        )