from app.models.schemas import VoiceProcessResponse
from app.services.asr_service import SpeechToTextService
from app.services.llm_service import LlmService
from app.services.nlp_service import IntentRecognitionService
from app.services.vector_store import VectorStore


class VoiceOrchestrator:
    def __init__(self) -> None:
        self.asr = SpeechToTextService()
        self.intent = IntentRecognitionService()
        self.vector_store = VectorStore()
        self.llm = LlmService()

    async def process_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        session_id: str,
    ) -> VoiceProcessResponse:
        transcript_result = await self.asr.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
        )
        intent_result = await self.intent.detect_intent(transcript_result.text)
        context = await self.vector_store.search(transcript_result.text)
        llm_result = await self.llm.generate_response(
            transcript=transcript_result.text,
            intent=intent_result,
            context=context,
        )

        confidence = round(
            (transcript_result.confidence + intent_result.confidence) / 2,
            2,
        )

        return VoiceProcessResponse(
            session_id=session_id,
            transcript=transcript_result.text,
            intent=intent_result.name,
            response_text=llm_result.text,
            confidence=confidence,
            data={
                **llm_result.data,
                "intent_confidence": intent_result.confidence,
                "entities": intent_result.entities,
            },
        )