from app.analyzers.common import band_from_thresholds, clamp

EXPENSE_RATIO_PENALTY = (
    (0.60, 0),
    (0.75, 10),
    (0.90, 20),
    (1.00, 35),
    (999.00, 45),
)

ACTIVE_LOAN_PENALTY = {"Yes": 15, "No": 0}
REPAYMENT_PENALTY = {"Never": 0, "Sometimes": 15, "Frequently": 30}

HEALTH_BANDS = (
    (34, "Critical"),
    (54, "Stressed"),
    (74, "Watch"),
    (100, "Healthy"),
)


def analyze_financial_health(payload: dict) -> dict:
    income = payload["monthly_income_range_baseline"]
    expenses = payload["average_monthly_household_expenses"]

    surplus = income - expenses
    ratio = expenses / income if income else 999

    score = 100
    score -= band_from_thresholds(ratio, EXPENSE_RATIO_PENALTY)
    score -= ACTIVE_LOAN_PENALTY[payload["has_active_loans"]]
    score -= REPAYMENT_PENALTY[payload["past_repayment_habit"]]
    score = int(clamp(score, 0, 100))

    return {
        "score": score,
        "health_band": band_from_thresholds(score, HEALTH_BANDS),
        "monthly_surplus_or_deficit": round(surplus, 2),
        "expense_to_income_ratio_percent": round(ratio * 100, 2),
    }