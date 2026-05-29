# ai_service/app/loan/arthscore_engine.py
# ArthScore calculation engine — scores 0 to 1000

def calculate_arth_score(payload: dict) -> dict:
    """
    Calculates ArthScore using weighted financial signals.
    Returns score + component breakdown for explainability.
    """
    profile = payload.get("userProfile", {})
    tx = profile.get("transactionSummary", {})
    rtc = profile.get("rtcData", {})
    loan_history = profile.get("loanHistory", [])

    requested = payload.get("requestedLoanAmount", 0)
    interest = payload.get("expectedInterestRate", 12)
    tenure = payload.get("tenureMonths", 12)

    avg_income = tx.get("avgIncome", 0)
    avg_expense = tx.get("avgExpense", 0)
    seasonal_risk = tx.get("seasonalIncomeVariation", False)
    expense_ratio = tx.get("expenseRatio", 1.0) or 1.0
    total_tx = tx.get("totalTransactions", 0)
    land_owned = rtc.get("landOwned", False)

    scores = {}

    # ── 1. Income stability (0–200) ──────────────────────
    if avg_income >= 30000:
        scores["income_stability"] = 200
    elif avg_income >= 20000:
        scores["income_stability"] = 160
    elif avg_income >= 12000:
        scores["income_stability"] = 110
    elif avg_income >= 6000:
        scores["income_stability"] = 70
    else:
        scores["income_stability"] = 30

    # Penalize seasonal variation
    if seasonal_risk:
        scores["income_stability"] = int(scores["income_stability"] * 0.8)

    # ── 2. Expense ratio (0–150) ─────────────────────────
    if expense_ratio <= 0.40:
        scores["expense_ratio"] = 150
    elif expense_ratio <= 0.55:
        scores["expense_ratio"] = 110
    elif expense_ratio <= 0.70:
        scores["expense_ratio"] = 70
    elif expense_ratio <= 0.85:
        scores["expense_ratio"] = 40
    else:
        scores["expense_ratio"] = 10

    # ── 3. Repayment capacity (0–150) ────────────────────
    disposable = avg_income - avg_expense
    emi = _calculate_emi(requested, interest, tenure)
    if disposable > 0 and emi > 0:
        emi_ratio = emi / disposable
        if emi_ratio <= 0.30:
            scores["repayment_capacity"] = 150
        elif emi_ratio <= 0.45:
            scores["repayment_capacity"] = 100
        elif emi_ratio <= 0.60:
            scores["repayment_capacity"] = 60
        else:
            scores["repayment_capacity"] = 20
    else:
        scores["repayment_capacity"] = 10

    # ── 4. Transaction history / app usage (0–150) ───────
    if total_tx >= 50:
        scores["transaction_history"] = 150
    elif total_tx >= 30:
        scores["transaction_history"] = 110
    elif total_tx >= 15:
        scores["transaction_history"] = 70
    elif total_tx >= 5:
        scores["transaction_history"] = 40
    else:
        scores["transaction_history"] = 10

    # ── 5. Land collateral (0–150) ───────────────────────
    collateral = payload.get("collateralValue") or 0
    if land_owned or collateral > 0:
        ratio = collateral / requested if requested > 0 else 0
        if ratio >= 1.5:
            scores["collateral"] = 150
        elif ratio >= 1.0:
            scores["collateral"] = 110
        elif ratio >= 0.5:
            scores["collateral"] = 70
        else:
            scores["collateral"] = 40
    else:
        scores["collateral"] = 0

    # ── 6. Loan history (0–100) ──────────────────────────
    if not loan_history:
        scores["loan_history"] = 50  # no history — neutral
    else:
        latest = loan_history[0]
        prev_risk = latest.get("riskLevel", "MODERATE")
        if prev_risk == "LOW":
            scores["loan_history"] = 100
        elif prev_risk == "MODERATE":
            scores["loan_history"] = 65
        else:
            scores["loan_history"] = 30

    # ── 7. Debt-to-income ratio (0–100) ──────────────────
    dti = emi / avg_income if avg_income > 0 else 1
    if dti <= 0.30:
        scores["dti"] = 100
    elif dti <= 0.45:
        scores["dti"] = 65
    elif dti <= 0.60:
        scores["dti"] = 35
    else:
        scores["dti"] = 10

    total = sum(scores.values())
    # Cap at 1000
    final_score = min(1000, max(0, total))

    return {
        "arthScore": final_score,
        "componentScores": scores,
        "_emi": emi,
        "_disposable": disposable,
        "_dti": round(dti, 3),
    }


def _calculate_emi(principal: float, annual_rate: float, months: int) -> float:
    if months <= 0 or principal <= 0:
        return 0
    if annual_rate == 0:
        return round(principal / months, 2)
    r = annual_rate / 12 / 100
    emi = principal * r * (1 + r) ** months / ((1 + r) ** months - 1)
    return round(emi, 2)