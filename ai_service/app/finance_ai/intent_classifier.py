
# ai_service/app/finance_ai/intent_classifier.py
# Rule-based + GPT intent detection for financial messages

import re

import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# INTENT DEFINITIONS
# ─────────────────────────────────────────


INTENTS = {
    "expense_tracking":   "User wants to log or record an expense or income.",
    "loan_query":         "User is asking about loans, EMI, repayment, or borrowing money.",
    "scam_check":         "User suspects a scam, OTP fraud, phishing, or suspicious payment.",
    "balance_inquiry":    "User wants to check savings, balance, or financial summary.",
    "financial_guidance": "User wants budgeting advice, savings tips, or financial planning.",
    "rtc_query":          "User has questions about land records, RTC documents, or property.",
    "general":            "General query not matching any specific financial intent.",
}


# ─────────────────────────────────────────
# KEYWORD RULES (multilingual — covers EN, HI, KN)
# ─────────────────────────────────────────

INTENT_KEYWORDS = {
    "expense_tracking": [
        # English
        "spent", "spend", "bought", "purchase", "expense", "cost", "paid", "pay",
        "bill", "grocery", "fuel", "rent", "income", "earned", "salary", "received",
        # Hindi
        "kharcha", "kharch", "kharida", "bikri", "paisa", "rupee", "diya", "mila",
        "kamaya", "aaya",
        # Kannada
        "kharchu", "kharchi", "sales", "vantige", "sikkitu",
    ],
    "loan_query": [
        # English
        "loan", "emi", "borrow", "lend", "debt", "interest", "repay", "installment",
        "credit", "mortgage", "kisan credit",
        # Hindi
        "karz", "udhaar", "byaj", "kist", "loan",
        # Kannada
        "sali", "saali", "nidhi", "savalu",
    ],
    "scam_check": [
        # English
        "scam", "fraud", "otp", "phishing", "fake", "suspicious", "threat", "hack",
        "password", "pin", "account blocked", "kyc", "verify your", "win prize",
        # Hindi
        "dhoka", "fraud", "otp", "nakli", "thagi",
        # Kannada
        "vyabhichara", "nakali",
    ],
    "balance_inquiry": [
        # English
        "balance", "savings", "how much", "total", "summary", "left", "remaining",
        # Hindi
        "kitna", "bacha", "jama",
        # Kannada
        "ulida", "entu",
    ],
    "financial_guidance": [
        # English
        "advice", "suggest", "help", "plan", "budget", "save", "invest", "tip",
        "guidance", "should i", "how to",
        # Hindi
        "salah", "madad", "kaise", "kya karu",
        # Kannada
        "sahaya", "hege", "suchane",
    ],
    "rtc_query": [
        # English
        "rtc", "land", "survey", "acre", "crop", "khasra", "khata", "property",
        "patta", "bhoomi",
        # Kannada
        "hola", "survey number", "bhumi",

INTENT_KEYWORDS = {
    "expense_tracking": [
        "spent", "spend", "bought", "purchase", "expense", "cost", "paid", "pay",
        "bill", "grocery", "fuel", "rent", "income", "earned", "salary", "received",
        "kharcha", "kharch", "kharida", "bikri", "paisa", "rupee", "diya", "mila",
        "kamaya", "aaya", "kharchu", "kharchi", "vantige", "sikkitu",
    ],
    "loan_query": [
        "loan", "emi", "borrow", "lend", "debt", "interest", "repay", "installment",
        "credit", "mortgage", "kisan credit", "karz", "udhaar", "byaj", "kist",
        "sali", "saali", "nidhi", "savalu",
    ],
    "scam_check": [
        "scam", "fraud", "otp", "phishing", "fake", "suspicious", "threat", "hack",
        "password", "pin", "account blocked", "kyc", "verify your", "win prize",
        "dhoka", "nakli", "thagi", "nakali",
    ],
    "balance_inquiry": [
        "balance", "savings", "how much", "total", "summary", "left", "remaining",
        "kitna", "bacha", "jama", "ulida", "entu",
    ],
    "financial_guidance": [
        "advice", "suggest", "help", "plan", "budget", "save", "invest", "tip",
        "guidance", "should i", "how to", "salah", "madad", "kaise", "kya karu",
        "sahaya", "hege", "suchane",
    ],
    "rtc_query": [
        "rtc", "land", "survey", "acre", "crop", "khasra", "khata", "property",
        "patta", "bhoomi", "hola", "bhumi",

    ],
}


def classify_intent(text: str, language: str = "en") -> str:

    """
    Fast rule-based intent classification using keyword matching.
    Falls back to 'general' if nothing matches.
    """

    if not text:
        return "general"

    text_lower = text.lower()

    scores = {intent: 0 for intent in INTENT_KEYWORDS}

    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[intent] += 1

    best_intent = max(scores, key=scores.get)


    # Only return non-general if there's at least one keyword match
    if scores[best_intent] == 0:
        return "general"

    logger.info(f"[INTENT] Detected '{best_intent}' for text: '{text[:60]}'")

    if scores[best_intent] == 0:
        return "general"

    logger.info(f"[INTENT] '{best_intent}' for: '{text[:60]}'")

    return best_intent


def get_intent_description(intent: str) -> str:
    return INTENTS.get(intent, INTENTS["general"])