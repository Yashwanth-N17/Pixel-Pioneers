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

# ─────────────────────────────────────────
# Type-detection keyword sets
# ─────────────────────────────────────────
_INCOME_KEYWORDS = frozenset([
    "earned", "earn", "earning", "received", "receive", "income", "salary",
    "profit", "gain", "sale", "sold", "got paid", "payment received",
    "mila", "kamaya", "aaya", "bikri", "huvike", "laabha", "vantige", "sikkitu",
])
_EXPENSE_KEYWORDS = frozenset([
    "spent", "spend", "bought", "buy", "paid", "pay", "expense", "cost",
    "purchased", "purchase", "bill", "grocery", "fuel", "rent", "food",
    "kharcha", "kharch", "kharida", "diya", "kotte", "nasta", "kharchi",
])


def _is_type_clear(text: str) -> bool:
    """Return True if the message clearly states income or expense type."""
    t = text.lower()
    return any(w in t for w in _INCOME_KEYWORDS) or any(w in t for w in _EXPENSE_KEYWORDS)


def _detect_first_amount(text: str) -> float | None:
    """Return the first monetary amount found (handles Indian comma format)."""
    m = re.search(r"(?:rs\.?|inr|rupees)?\s*([\d,]+(?:\.\d+)?)", text.lower())
    if m:
        try:
            val = float(m.group(1).replace(",", ""))
            return val if val > 0 else None
        except ValueError:
            return None
    return None


# ─────────────────────────────────────────
# System prompt builders
# ─────────────────────────────────────────
def build_system_prompt(
    user_context: dict[str, Any],
    language: str,
    ask_clarification: bool = False,
    pending_amount: float | None = None,
) -> str:
    language_instruction = {
        "en": "Respond only in English.",
        "hi": "Respond only in Hindi.",
        "kn": "Respond only in Kannada.",
        "te": "Respond only in Telugu.",
        "ta": "Respond only in Tamil.",
        "mr": "Respond only in Marathi.",
    }.get(language, "Respond only in English.")

    clarification_hint = ""
    if ask_clarification and pending_amount is not None:
        clarification_hint = (
            f"\n\nIMPORTANT: The user mentioned an amount of Rs {pending_amount:,.0f} but did NOT specify "
            "whether it is income or an expense. You MUST ask them exactly once: "
            "'Is Rs {amount:,.0f} income or an expense?' — do not save anything yet.".format(
                amount=pending_amount
            )
        )

    return f"""You are ArthSaathi, a warm rural financial assistant for India.
{language_instruction}

User profile:
- Name: {user_context.get("name", "the user")}
- Occupation: {user_context.get("occupation", "unknown")}
- Monthly income: Rs {user_context.get("monthly_income", "unknown")}
- Monthly expenses: Rs {user_context.get("monthly_expenses", "unknown")}
- Repayment habit: {user_context.get("repayment_habit", "unknown")}

Give simple, practical advice about budgeting, expenses, loans, savings, and scam safety.
If the user clearly states income or an expense amount, assure them it has been saved to their ledger.
Keep the reply short, clear, and respectful. Never recommend specific stocks or trading.{clarification_hint}"""


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


# ─────────────────────────────────────────
# Rule-based transaction extractor
# ─────────────────────────────────────────
def _extract_transactions_rule_based(text: str) -> list[dict[str, Any]]:
    """Rule-based fallback: handles plain numbers AND Indian comma-formatted numbers (10,000 / 1,00,000)."""
    transactions = []
    pattern = r"(?:rs\.?|inr|rupees)?\s*([\d,]+(?:\.\d+)?)"
    for match in re.finditer(pattern, text.lower()):
        raw_number = match.group(1).replace(",", "")
        try:
            amount = float(raw_number)
        except ValueError:
            continue
        if amount <= 0:
            continue
        window = text[max(0, match.start() - 40): match.end() + 40].lower()
        tx_type = "income" if any(word in window for word in _INCOME_KEYWORDS) else "expense"
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


# ─────────────────────────────────────────
# Groq-powered transaction extractor
# ─────────────────────────────────────────
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


# ─────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────
async def process_chat_message(message: str, language: str, user_context: dict[str, Any]) -> dict[str, Any]:
    intent = classify_intent(message, language)
    logger.info("[CHAT] intent=%s language=%s", intent, language)

    # ── Decide whether to extract immediately or ask for clarification ──
    _amount_pattern = r"(?:rs\.?|inr|rupees[\s]?)[\s]?[\d,]+|(?<!\w)\d[\d,]{2,}"
    _has_amount = bool(re.search(_amount_pattern, message.lower()))

    requires_clarification = False
    pending_transaction: dict[str, Any] | None = None
    detected_expenses: list[dict[str, Any]] = []

    if _has_amount:
        if _is_type_clear(message):
            # User clearly stated income or expense → extract and auto-save
            detected_expenses = await extract_expenses_from_text(message, language)
            logger.info("[CHAT] Auto-extracted %d transaction(s)", len(detected_expenses))
        else:
            # Amount found but type is ambiguous → ask once
            amount = _detect_first_amount(message)
            if amount:
                requires_clarification = True
                pending_transaction = {"amount": amount, "category": "General"}
                logger.info("[CHAT] Ambiguous amount Rs %s — requesting clarification", amount)

    # ── Generate AI reply (with clarification hint if needed) ──
    ai_reply = _fallback_reply(intent, language)
    if settings.GROQ_API_KEY and AsyncGroq is not None:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        try:
            system_prompt = build_system_prompt(
                user_context,
                language,
                ask_clarification=requires_clarification,
                pending_amount=pending_transaction["amount"] if pending_transaction else None,
            )
            response = await client.chat.completions.create(
                model=settings.GROQ_CHAT_MODEL or DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                max_tokens=400,
                temperature=0.4,
            )
            ai_reply = (response.choices[0].message.content or ai_reply).strip()
        except Exception as exc:
            logger.warning("[CHAT] Groq chat failed, using fallback: %s", exc)

    return {
        "response": ai_reply,
        "intent": intent,
        "language": language,
        "detected_expenses": detected_expenses,
        "suggestions": build_suggestions(intent),
        "requires_clarification": requires_clarification,
        "pending_transaction": pending_transaction,
    }
