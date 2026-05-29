from app.models.schemas import IntentResult, LlmResult


class LlmService:
    async def generate_response(
        self,
        transcript: str,
        intent: IntentResult,
        context: list[dict],
    ) -> LlmResult:
        context_titles = [item.get("title") for item in context]

        # Replace this mock with OpenAI Responses API, Anthropic, Gemini, or local LLM.
        response = (
            f"I understood your request as '{intent.name}'. "
            "Here is a helpful response based on the voice input."
        )

        return LlmResult(
            text=response,
            data={
                "provider": "mock",
                "context_titles": context_titles,
                "transcript_length": len(transcript),
            },
        )