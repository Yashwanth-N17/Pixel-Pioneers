def predict_savings(payload: dict) -> dict:
    income = payload["monthly_income_range_baseline"]
    expenses = payload["average_monthly_household_expenses"]

    monthly_savings = income - expenses
    conservative_savings = max(monthly_savings * 0.8, 0)

    return {
        "current_monthly_savings_capacity": round(monthly_savings, 2),
        "conservative_monthly_savings_capacity": round(conservative_savings, 2),
        "six_month_projection": round(conservative_savings * 6, 2),
        "twelve_month_projection": round(conservative_savings * 12, 2),
    }