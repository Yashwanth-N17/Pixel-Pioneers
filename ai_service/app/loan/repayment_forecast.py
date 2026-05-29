# ai_service/app/loan/repayment_forecast.py
# Generates month-by-month repayment forecast

def generate_forecast(principal: float, annual_rate: float,
                      tenure: int, avg_income: float,
                      seasonal_variation: bool) -> list:
    """
    Returns list of monthly forecast entries.
    Simulates seasonal income dip in harvest/off-season months.
    """
    if tenure <= 0 or principal <= 0:
        return []

    r = annual_rate / 12 / 100 if annual_rate > 0 else 0
    emi = (
        principal * r * (1 + r) ** tenure / ((1 + r) ** tenure - 1)
        if r > 0
        else principal / tenure
    )
    emi = round(emi, 2)

    balance = principal
    forecast = []

    for month in range(1, tenure + 1):
        # Seasonal income simulation — dip in months 3,4,9,10 for farmers
        if seasonal_variation and month % 12 in [3, 4, 9, 10]:
            predicted_income = round(avg_income * 0.65, 2)
        else:
            predicted_income = round(avg_income * 1.05 if month % 6 == 0 else avg_income, 2)

        interest_component = round(balance * r, 2) if r > 0 else 0
        principal_component = round(emi - interest_component, 2)
        balance = max(0, round(balance - principal_component, 2))

        forecast.append({
            "month": month,
            "predictedIncome": predicted_income,
            "emi": emi,
            "interestComponent": interest_component,
            "principalComponent": principal_component,
            "remainingBalance": balance,
            "canAfford": predicted_income >= emi,
        })

    return forecast