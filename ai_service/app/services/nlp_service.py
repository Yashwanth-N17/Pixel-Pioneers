from app.models.schemas import IntentResult


class IntentRecognitionService:
    async def detect_intent(self, transcript: str) -> IntentResult:
        normalized = transcript.lower()

        if "order" in normalized:
            return IntentResult(name="create_order", confidence=0.88)
        if "help" in normalized or "assist" in normalized:
            return IntentResult(name="support_request", confidence=0.86)
        if "status" in normalized:
            return IntentResult(name="check_status", confidence=0.84)

        return IntentResult(name="general_query", confidence=0.72)