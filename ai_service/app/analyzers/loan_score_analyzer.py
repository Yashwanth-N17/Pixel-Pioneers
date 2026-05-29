from app.analyzers.common import band_from_thresholds, clamp

PURPOSE_PRODUCTS = {
    "Agriculture": ["SBI Kisan Credit Card", "NABARD Farm Loan", "Local MFI - Grameen"],
    "Business": ["Mudra Business Loan", "Cooperative Business Loan", "MFI Working Capital"],
    "Emergency": ["Jan Dhan Overdraft", "Emergency MFI Loan", "Cooperative Short Loan"],
    "Education": ["SBI Skill Loan", "Vidya Lakshmi Loan", "Cooperative Education Loan"],
}

PURPOSE_MULTIPLIER = {
    "Agriculture": 1.6,
    "Business": 1.8,
    "Emergency": 0.8,
    "Education": 1.2,
}

COLLATERAL_SCORE = {"Land": 140, "Gold": 90, "None": 0}
REPAYMENT_SCORE = {"Never": 120, "Sometimes": 40, "Frequently": -100}
EXISTING_LOAN_SCORE = {"Yes": -80, "No": 80}

SCORE_LABELS = (
    (499, "Needs Review"),
    (699, "Fair"),
    (799, "Good"),
    (1000, "Excellent"),
)

RISK_LABELS = (
    (499, "High"),
    (699, "Moderate"),
    (1000, "Low"),
)


def analyze_loan_request(payload: dict) -> dict:
    score = calculate_arthscore(payload)
    eligible_amount = calculate_eligible_amount(payload, score)
    tenure = calculate_best_tenure(payload, score)
    emi = calculate_emi(eligible_amount, tenure)
    risk_level = band_from_thresholds(score, RISK_LABELS)

    return {
        "arthscore": {
            "score": score,
            "max_score": 1000,
            "label": band_from_thresholds(score, SCORE_LABELS),
            "progress_percent": round(score / 10, 2),
        },
        "loan_result": {
            "eligible_amount": round(eligible_amount, 2),
            "best_tenure_months": tenure,
            "estimated_emi_per_month": round(emi, 2),
            "risk_level": risk_level,
        },
        "explainability": build_explainability(payload),
        "recommended_loan_products": PURPOSE_PRODUCTS[payload["loan_purpose"]],
        "lender_dashboard": {
            "display_on": ["/dashboard", "/applicants", "/applicants/:id", "/analytics"],
            "card_type": "arthscore_loan_card",
            "portfolio_risk_level": risk_level,
        },
    }


def calculate_arthscore(payload: dict) -> int:
    emi_ratio = payload["existing_monthly_emi"] / payload["current_income"]
    amount_ratio = payload["amount_needed"] / payload["current_income"]

    score = 520
    score += COLLATERAL_SCORE[payload["collateral"]]
    score += REPAYMENT_SCORE[payload["past_repayment_habit"]]
    score += EXISTING_LOAN_SCORE[payload["existing_loans"]]
    score += {True: 70, False: -50}[payload["regular_sms_transactions"]]
    score -= int(payload["irregular_income_months"] * 20)
    score -= int(emi_ratio * 250)
    score -= int(max(amount_ratio - 3, 0) * 20)

    return int(clamp(score, 300, 1000))


def calculate_eligible_amount(payload: dict, score: int) -> float:
    emi_capacity = payload["current_income"] * 0.35
    available_capacity = max(emi_capacity - payload["existing_monthly_emi"], 0)
    score_factor = score / 1000
    purpose_factor = PURPOSE_MULTIPLIER[payload["loan_purpose"]]

    amount = available_capacity * payload["repayment_period_months"] * purpose_factor * score_factor
    return min(amount, payload["amount_needed"])


def calculate_best_tenure(payload: dict, score: int) -> int:
    extra_months = {True: 0, False: 6}[score >= 700]
    return int(clamp(payload["repayment_period_months"] + extra_months, 3, 60))


def calculate_emi(principal: float, months: int) -> float:
    if principal <= 0:
        return 0
    monthly_rate = 0.12 / 12
    power = (1 + monthly_rate) ** months
    return principal * monthly_rate * power / (power - 1)


def build_explainability(payload: dict) -> dict:
    positive_rules = {
        "Regular SMS transactions": payload["regular_sms_transactions"],
        "No existing defaults": payload["past_repayment_habit"] == "Never",
        "Collateral available": payload["collateral"] != "None",
        "No existing loans": payload["existing_loans"] == "No",
    }
    warning_rules = {
        "Irregular income months": payload["irregular_income_months"] > 0,
        "Existing EMI burden": payload["existing_monthly_emi"] > 0,
        "No collateral available": payload["collateral"] == "None",
    }
    return {
        "positive_factors": [k for k, v in positive_rules.items() if v],
        "warning_factors": [k for k, v in warning_rules.items() if v],
    }