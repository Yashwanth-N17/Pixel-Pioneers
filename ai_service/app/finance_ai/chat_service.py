
# ai_service/app/finance_ai/chat_service.py
# Core GPT-based financial chat logic for ArthSaathi

import json
import logging
from openai import AsyncOpenAI
from app.config import settings

import json
import logging

from groq import AsyncGroq

from app.core.config import settings

from app.finance_ai.intent_classifier import classify_intent

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# ─────────────────────────────────────────
# SYSTEM PROMPT BUILDER
# ─────────────────────────────────────────

def build_system_prompt(user_context: dict, language: str) -> str:
    """
    Builds a language-aware, occupation-aware system prompt.
    """

    language_instruction = {
        "en": "Respond only in English.",
        "hi": "हमेशा हिंदी में जवाब दें। (Always respond in Hindi.)",
        "kn": "ಯಾವಾಗಲೂ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ ಕೊಡಿ. (Always respond in Kannada.)",
    }.get(language, "Respond only in English.")


# Uses Groq (free tier) — llama-3.3-70b-versatile is free and very capable
client = AsyncGroq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"


def build_system_prompt(user_context: dict, language: str) -> str:
    language_instruction = {
        "en": "Respond only in English.",
        "hi": "हमेशा हिंदी में जवाब दें।",
        "kn": "ಯಾವಾಗಲೂ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ ಕೊಡಿ.",
        "te": "ఎల్లప్పుడూ తెలుగులో సమాధానం ఇవ్వండి.",
        "ta": "எப்போதும் தமிழில் பதில் சொல்லுங்கள்.",
        "mr": "नेहमी मराठीत उत्तर द्या.",
    }.get(language, "Respond only in English.")

    name = user_context.get("name", "the user")

    occupation = user_context.get("occupation", "unknown")
    monthly_income = user_context.get("monthly_income", "unknown")
    monthly_expenses = user_context.get("monthly_expenses", "unknown")
    repayment_habit = user_context.get("repayment_habit", "unknown")

    name = user_context.get("name", "the user")

    return f"""You are ArthSaathi — a trusted, warm, and knowledgeable AI financial assistant 
designed specifically for rural and underserved communities in India.


    return f"""You are ArthSaathi — a trusted, warm AI financial assistant for rural and underserved communities in India.


{language_instruction}

USER PROFILE:
- Name: {name}
- Occupation: {occupation}
- Monthly Income: ₹{monthly_income}
- Monthly Expenses: ₹{monthly_expenses}
- Loan Repayment Habit: {repayment_habit}

YOUR RESPONSIBILITIES:
1. EXPENSE TRACKING — Extract and confirm expenses or income mentioned by the user.
2. LOAN GUIDANCE — Assess loan viability based on income/expense ratio. Warn against predatory lenders.
3. SCAM DETECTION — Identify OTP scams, fake bank calls, phishing. Be alert and protective.
4. FINANCIAL GUIDANCE — Give practical, simple budgeting and savings advice tailored to their occupation.
5. GENERAL SUPPORT — Answer financial questions in simple, clear language.

RESPONSE RULES:
- Use SIMPLE language. Avoid jargon.
- Be empathetic and encouraging — never condescending.

- If the user is recording an expense or income, confirm it clearly and ask if they want to save it.
- If you detect a scam, warn them CLEARLY and tell them never to share OTPs or passwords.
- Keep responses SHORT (2-4 sentences max) unless detailed guidance is requested.
- Always respond in the user's preferred language as instructed above.

IMPORTANT: Never give advice about specific stocks or trading. Focus only on personal finance, budgeting, loans, scam protection, and savings."""


# ─────────────────────────────────────────
# EXPENSE EXTRACTION
# ─────────────────────────────────────────

async def extract_expenses_from_text(text: str, language: str) -> list:
    """
    Uses GPT to extract structured expense/income entries from natural language.
    Returns a list of detected transactions (may be empty).
    """
    extraction_prompt = f"""Extract any expense or income mentions from the following text.
Return ONLY a JSON array. Each item must have:
- type: "expense" | "income"
- amount: number (in INR)
- category: string (e.g. "Groceries", "Fuel", "Salary", "Farming")
- note: string (brief description)

If nothing is found, return an empty array [].

- Keep responses SHORT (2-4 sentences max) unless detailed guidance is requested.
- Never give advice about specific stocks or trading."""


async def extract_expenses_from_text(text: str) -> list:
    prompt = f"""Extract any expense or income mentions from the following text.
Return ONLY a JSON array. Each item must have:
- type: "expense" | "income"
- amount: number (in INR)
- category: string (e.g. "Groceries", "Fuel", "Salary")
- note: string (brief description)

If nothing found, return [].

Text: "{text}"
JSON:"""

    try:
        response = await client.chat.completions.create(

            model="gpt-4o-mini",
            messages=[{"role": "user", "content": extraction_prompt}],

            model=MODEL,
            messages=[{"role": "user", "content": prompt}],

            max_tokens=300,
            temperature=0,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"[CHAT] Expense extraction failed: {str(e)}")
        return []


# ─────────────────────────────────────────
# MAIN CHAT HANDLER
# ─────────────────────────────────────────

async def process_chat_message(
    message: str,
    language: str,
    user_context: dict,
) -> dict:
    """
    Main function: classifies intent, calls GPT, extracts expenses.
    Returns structured response dict.
    """
    # Step 1 — Classify intent
    intent = classify_intent(message, language)
    logger.info(f"[CHAT] Intent: {intent} | Language: {language}")

    # Step 2 — Build system prompt
    system_prompt = build_system_prompt(user_context, language)

    # Step 3 — Compose messages

        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"[CHAT] Expense extraction failed: {e}")
        return []


async def process_chat_message(message: str, language: str, user_context: dict) -> dict:
    intent = classify_intent(message, language)
    logger.info(f"[CHAT] Intent: {intent} | Language: {language}")

    system_prompt = build_system_prompt(user_context, language)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    # Step 4 — Call GPT
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",

    try:
        response = await client.chat.completions.create(
            model=MODEL,

            messages=messages,
            max_tokens=400,
            temperature=0.5,
        )
        ai_reply = response.choices[0].message.content.strip()
    except Exception as e:

        logger.error(f"[CHAT] GPT call failed: {str(e)}")
        raise RuntimeError(f"GPT processing failed: {str(e)}")

    # Step 5 — Extract expenses if intent matches
    detected_expenses = []
    if intent == "expense_tracking":
        detected_expenses = await extract_expenses_from_text(message, language)

    # Step 6 — Build suggestions
    suggestions = build_suggestions(intent)

        logger.error(f"[CHAT] Groq call failed: {e}")
        raise RuntimeError(f"AI processing failed: {e}")

    detected_expenses = []
    if intent == "expense_tracking":
        detected_expenses = await extract_expenses_from_text(message)


    return {
        "response": ai_reply,
        "intent": intent,
        "language": language,
        "detected_expenses": detected_expenses,

        "suggestions": suggestions,

        "suggestions": build_suggestions(intent),

    }


def build_suggestions(intent: str) -> list:

    """
    Return contextual next-action suggestions based on detected intent.
    These are sent to the frontend as quick-reply chips.
    """
=
    suggestion_map = {
        "expense_tracking": [
            "Save this expense",
            "View my expenses this month",
            "How much have I spent today?",
        ],
        "loan_query": [
            "Check my loan repayment capacity",
            "What is a safe loan amount for me?",
            "Explain interest rates simply",
        ],
        "scam_check": [
            "How do I report this scam?",
            "What should I never share on phone?",
            "Block this number",
        ],
        "balance_inquiry": [
            "Show my expense summary",
            "How much can I save this month?",
        ],
        "financial_guidance": [
            "Give me a savings plan",
            "How do I reduce expenses?",
            "Best way to save for emergencies",
        ],
        "general": [
            "Help me track expenses",
            "Explain loan safety",
            "How do I avoid scams?",
        ],
    }
    return suggestion_map.get(intent, suggestion_map["general"])