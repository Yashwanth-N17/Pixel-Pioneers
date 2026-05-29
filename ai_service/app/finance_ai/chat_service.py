import json
import logging
import re
from typing import Any

try:
    from groq import AsyncGroq
except ImportError:  # pragma: no cover - allows local boot without optional AI SDK
    AsyncGroq = None

from app.core.config import settings
from app.finance_ai.intent_classifier import classify_intent

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "llama-3.1-8b-instant"


def build_system_prompt(user_context: dict[str, Any], language: str) -> str:
    language_instruction = {
        "en": "Respond only in English.",
        "hi": "Respond only in Hindi.",
        "kn": "Respond only in Kannada.",
        "te": "Respond only in Telugu.",
        "ta": "Respond only in Tamil.",
        "mr": "Respond only in Marathi.",
    }.get(language, "Respond only in English.")

    return f"""You are ArthSaathi, a warm rural financial assistant for India.
{language_instruction}

User profile:
- Name: {user_context.get("name", "the user")}
- Occupation: {user_context.get("occupation", "unknown")}
- Monthly income: Rs {user_context.get("monthly_income", "unknown")}
- Monthly expenses: Rs {user_context.get("monthly_expenses", "unknown")}
- Repayment habit: {user_context.get("repayment_habit", "unknown")}

Give simple, practical advice about budgeting, expenses, loans, savings, and scam safety.
If the user mentions an income or expense amount, assure them that you have automatically saved it to their ledger.
Keep the reply short, clear, and respectful. Never recommend specific stocks or trading."""


def build_suggestions(intent: str) -> list[str]:
    suggestion_map = {
        "expense_tracking": ["Save this expense", "View expenses", "Check this month's spending"],
        "loan_query": ["Check loan capacity", "Explain EMI", "Safe borrowing tips"],
        "scam_check": ["Report scam", "OTP safety", "Block suspicious number"],
        "balance_inquiry": ["Show summary", "Savings plan", "Expense breakdown"],
        "financial_guidance": ["Create budget", "Reduce expenses", "Emergency fund"],
        "rtc_query": ["Explain RTC", "Land record help", "Survey number help"],
        "general": ["Track expenses", "Loan safety", "Avoid scams"],
    }
    return suggestion_map.get(intent, suggestion_map["general"])


def _fallback_reply(intent: str, language: str) -> str:
    replies = {
        "expense_tracking": "I found a money entry. Please review it before saving.",
        "loan_query": "Check that EMI stays affordable after monthly expenses and avoid unsafe lenders.",
        "scam_check": "Be careful. Never share OTP, PIN, password, or bank details with anyone.",
        "balance_inquiry": "Compare income, expenses, and savings to know what is left this month.",
        "financial_guidance": "Start with a simple budget: needs first, then savings, then flexible spending.",
        "rtc_query": "RTC details should match the owner name, survey number, land area, and crop details.",
        "general": "I can help with budgeting, expenses, loans, savings, and scam safety.",
    }
    return replies.get(intent, replies["general"])


def _extract_transactions_rule_based(text: str) -> list[dict[str, Any]]:
    transactions = []
    for match in re.finditer(r"(?:rs\.?|inr|rupees)?\s*(\d+(?:\.\d+)?)", text.lower()):
        amount = float(match.group(1))
        window = text[max(0, match.start() - 35): match.end() + 35].lower()
        tx_type = "income" if any(word in window for word in ["earned", "received", "income", "salary", "mila", "kamaya"]) else "expense"
        category = "General"
        if any(word in window for word in ["food", "grocery", "rice", "vegetable"]):
            category = "Food"
        elif any(word in window for word in ["fuel", "bus", "transport"]):
            category = "Transport"
        elif any(word in window for word in ["seed", "fertilizer", "farm"]):
            category = "Farming"
        transactions.append({"type": tx_type, "amount": amount, "category": category, "note": window.strip()})
    return transactions


async def extract_expenses_from_text(text: str, language: str = "en") -> list[dict[str, Any]]:
    if not settings.GROQ_API_KEY or AsyncGroq is None:
        return _extract_transactions_rule_based(text)

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    prompt = f"""Extract expense or income entries from this text. The text is in {language} language, but return the category and note in English.
Return only JSON shaped like {{"transactions":[{{"type":"expense","amount":120,"category":"Food","note":"rice"}}]}}.
If nothing is found, return {{"transactions":[]}}.

Text: {text}"""

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_CHAT_MODEL or DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            return parsed.get("transactions") or parsed.get("items") or []
    except Exception as exc:
        logger.warning("[CHAT] Transaction extraction failed: %s", exc)
    return _extract_transactions_rule_based(text)


async def process_chat_message(message: str, language: str, user_context: dict[str, Any]) -> dict[str, Any]:
    intent = classify_intent(message, language)
    logger.info("[CHAT] intent=%s language=%s", intent, language)

    ai_reply = _fallback_reply(intent, language)
    if settings.GROQ_API_KEY and AsyncGroq is not None:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        try:
            response = await client.chat.completions.create(
                model=settings.GROQ_CHAT_MODEL or DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": build_system_prompt(user_context, language)},
                    {"role": "user", "content": message},
                ],
                max_tokens=400,
                temperature=0.4,
            )
            ai_reply = (response.choices[0].message.content or ai_reply).strip()
        except Exception as exc:
            logger.warning("[CHAT] Groq chat failed, using fallback: %s", exc)

    detected_expenses = []
    if intent == "expense_tracking":
        detected_expenses = await extract_expenses_from_text(message, language)

    return {
        "response": ai_reply,
        "intent": intent,
        "language": language,
        "detected_expenses": detected_expenses,
        "suggestions": build_suggestions(intent),
    }
