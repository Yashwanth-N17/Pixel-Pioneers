from app.analyzers.common import band_from_thresholds, clamp

ACTIVE_LOAN_RISK = {"Yes": 20, "No": 0}
REPAYMENT_RISK = {"Never": 0, "Sometimes": 20, "Frequently": 35}

SPENDING_RISK = {
    "Controlled Spending": 0,
    "Balanced Spending": 5,
    "High Expense Pressure": 15,
    "Deficit Spending": 25,
}

RISK_BANDS = (
    (35, "Low"),
    (60, "Moderate"),
    (80, "High"),
    (100, "Critical"),
)


def calculate_loan_risk(payload: dict, financial_health: dict, spending_behavior: dict) -> dict:
    surplus = financial_health["monthly_surplus_or_deficit"]
    surplus_risk = 25 if surplus < 0 else 10 if surplus < 3000 else 0

    risk_score = 20
    risk_score += ACTIVE_LOAN_RISK[payload["has_active_loans"]]
    risk_score += REPAYMENT_RISK[payload["past_repayment_habit"]]
    risk_score += SPENDING_RISK[spending_behavior["behavior_band"]]
    risk_score += surplus_risk
    risk_score = int(clamp(risk_score, 0, 100))

    risk_band = band_from_thresholds(risk_score, RISK_BANDS)

    return {
        "risk_score": risk_score,
        "risk_band": risk_band,
        "loan_readiness": risk_band in {"Low", "Moderate"},
    }