import logging

logger = logging.getLogger(__name__)

INTENTS = {
    "expense_tracking": "User wants to log or record an expense or income.",
    "loan_query": "User is asking about loans, EMI, repayment, or borrowing money.",
    "scam_check": "User suspects a scam, OTP fraud, phishing, or suspicious payment.",
    "balance_inquiry": "User wants to check savings, balance, or financial summary.",
    "financial_guidance": "User wants budgeting advice, savings tips, or financial planning.",
    "rtc_query": "User has questions about land records, RTC documents, or property.",
    "general": "General query not matching any specific financial intent.",
}

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
    if not text:
        return "general"

    text_lower = text.lower()
    scores = {intent: 0 for intent in INTENT_KEYWORDS}

    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[intent] += 1

    best_intent = max(scores, key=scores.get)
    if scores[best_intent] == 0:
        return "general"

    logger.info("[INTENT] %s detected for language=%s", best_intent, language)
    return best_intent


def get_intent_description(intent: str) -> str:
    return INTENTS.get(intent, INTENTS["general"])
