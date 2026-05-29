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
    """Rule-based fallback: handles plain numbers AND Indian comma-formatted numbers (10,000 / 1,00,000)."""
    transactions = []
    # Match optional Rs/INR prefix, then number with optional Indian-style commas
    pattern = r"(?:rs\.?|inr|rupees)?\s*([\d,]+(?:\.\d+)?)"
    for match in re.finditer(pattern, text.lower()):
        raw_number = match.group(1).replace(",", "")  # strip commas: "10,000" -> "10000"
        try:
            amount = float(raw_number)
        except ValueError:
            continue
        if amount <= 0:
            continue
        window = text[max(0, match.start() - 40): match.end() + 40].lower()
        # Determine income vs expense from surrounding context
        income_words = ["earned", "earn", "received", "receive", "income", "salary",
                        "profit", "gain", "sale", "sold", "mila", "kamaya", "aaya",
                        "bikri", "huvike", "laabha", "vantige", "sikkitu"]
        tx_type = "income" if any(word in window for word in income_words) else "expense"
        category = "General"
        if any(word in window for word in ["food", "grocery", "rice", "vegetable", "sabzi"]):
            category = "Food"
        elif any(word in window for word in ["fuel", "bus", "transport", "petrol", "auto"]):
            category = "Transport"
        elif any(word in window for word in ["seed", "fertilizer", "farm", "crop", "khet"]):
            category = "Farming"
        elif any(word in window for word in ["milk", "dairy"]):
            category = "Dairy"
        transactions.append({"type": tx_type, "amount": amount, "category": category, "note": window.strip()})
    return transactions


async def extract_expenses_from_text(text: str, language: str = "en") -> list[dict[str, Any]]:
    if not settings.GROQ_API_KEY or AsyncGroq is None:
        return _extract_transactions_rule_based(text)

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    prompt = f"""You are a financial data extractor. Extract ALL expense or income entries mentioned in the text below.
The text is in {language} language. Return category and note in English.

Rules:
- "type" must be exactly "expense" or "income"
- If the user says earned / received / sold / profit / salary / income → type is "income"
- If the user says spent / bought / paid / expense / cost → type is "expense"
- "amount" must be a plain number (no commas, e.g. 10000 not 10,000)
- If no money amount is found, return {{"transactions":[]}}

Return ONLY valid JSON shaped like:
{{"transactions": [
  {{"type": "income", "amount": 10000, "category": "General", "note": "earned from work"}},
  {{"type": "expense", "amount": 500, "category": "Food", "note": "rice purchase"}}
]}}

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

    # Extract transactions if message mentions any money-related content
    # (runs for expense_tracking intent OR if message contains a numeric amount pattern)
    detected_expenses = []
    _has_amount = bool(re.search(r"(?:rs\.?|inr|rupees|\brs\b)[\s]?[\d,]+|\b\d[\d,]*\b", message.lower()))
    if intent == "expense_tracking" or _has_amount:
        detected_expenses = await extract_expenses_from_text(message, language)

    return {
        "response": ai_reply,
        "intent": intent,
        "language": language,
        "detected_expenses": detected_expenses,
        "suggestions": build_suggestions(intent),
    }
