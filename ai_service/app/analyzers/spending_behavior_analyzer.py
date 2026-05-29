from app.analyzers.common import band_from_thresholds

SPENDING_BANDS = (
    (0.60, "Controlled Spending"),
    (0.80, "Balanced Spending"),
    (1.00, "High Expense Pressure"),
    (999.00, "Deficit Spending"),
)

SPENDING_NOTES = {
    "Controlled Spending": "Household expenses leave meaningful room for savings.",
    "Balanced Spending": "Expenses are manageable but should be watched monthly.",
    "High Expense Pressure": "Most income is consumed by expenses.",
    "Deficit Spending": "Monthly expenses exceed reported income.",
}


def analyze_spending_behavior(payload: dict) -> dict:
    income = payload["monthly_income_range_baseline"]
    expenses = payload["average_monthly_household_expenses"]
    ratio = expenses / income if income else 999
    band = band_from_thresholds(ratio, SPENDING_BANDS)

    return {
        "behavior_band": band,
        "expense_ratio_percent": round(ratio * 100, 2),
        "behavior_note": SPENDING_NOTES[band],
    }