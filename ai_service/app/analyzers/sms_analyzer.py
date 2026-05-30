import json
import logging
from typing import Any

from app.core.config import settings
from app.schemas.ai_analysis_schema import SmsAnalysisRequest

logger = logging.getLogger(__name__)

try:
    from groq import AsyncGroq
except ImportError:
    AsyncGroq = None


async def analyze_sms_batch(request: SmsAnalysisRequest) -> dict[str, Any]:
    """
    Takes a batch of SMS messages, sends them to Groq LLM, and returns
    a JSON containing scam/fraud classifications.
    """
    if not settings.GROQ_API_KEY or AsyncGroq is None:
        logger.error("[SMS_ANALYZER] Groq API key or library missing.")
        # Return fallback safe responses
        return {
            "insights": [
                {"id": msg.id, "status": "SAFE", "reason": "AI Analysis unavailable."}
                for msg in request.messages
            ]
        }

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # Format messages for the prompt
    msg_list = []
    for m in request.messages:
        msg_list.append(f"ID: {m.id} | SENDER: {m.sender} | BODY: {m.body}")

    messages_str = "\n".join(msg_list)

    prompt = f"""
You are an expert fraud and scam detection system for Indian rural and semi-urban users.
Analyze the following SMS messages and classify each as SAFE, WARNING, or SCAM.

Criteria for SCAM:
- Fake lottery wins, prize money, KBC Jio lucky draw.
- Urgent KYC updates with suspicious bit.ly or generic links.
- "Your electricity will be cut off tonight, call this number".
- Fake job offers promising easy money.

Criteria for WARNING:
- OTPs that the user didn't request (we can't know, but warn them not to share it).
- Unknown links that aren't obviously malicious but seem promotional.

Criteria for SAFE:
- Standard bank transaction alerts from known headers (e.g., AD-HDFCBK).
- Regular conversational messages from normal numbers.
- Legitimate app OTPs (just standard SAFE behavior, though remind never to share).

You MUST output ONLY valid JSON in this exact format:
{{
  "insights": [
    {{
      "id": "message_id_here",
      "status": "SCAM",  // or SAFE or WARNING
      "reason": "Clear, short explanation of why this is a scam or safe."
    }}
  ]
}}

CRITICAL REQUIREMENT: The "reason" field MUST be written in the following language: {request.language}. If it is Hindi or Kannada etc., write the explanation in that script (e.g. Hindi in Devanagari).

Here are the messages to analyze:
{messages_str}
"""

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        result = json.loads(content)
        return result
    except Exception as e:
        logger.error(f"[SMS_ANALYZER] Error from Groq: {e}")
        return {
            "insights": [
                {"id": msg.id, "status": "SAFE", "reason": f"Analysis failed: {str(e)}"}
                for msg in request.messages
            ]
        }
