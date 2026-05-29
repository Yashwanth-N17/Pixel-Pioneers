# ai_service/app/loan/loan_analysis_service.py
# Orchestrates the full loan intelligence analysis

from openai import OpenAI
import os
import json

from .arthscore_engine import calculate_arth_score, _calculate_emi
from .repayment_forecast import generate_forecast
from .recommendation_engine import get_recommendations

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_loan(payload: dict) -> dict:
    """
    Full ArthScore loan intelligence pipeline.
    """
    profile = payload.get("userProfile", {})
    tx = profile.get("transactionSummary", {})
    rtc = profile.get("rtcData", {})

    requested = payload.get("requestedLoanAmount", 0)
    interest = payload.get("expectedInterestRate", 12)
    tenure = payload.get("tenureMonths", 12)
    purpose = payload.get("loanPurpose", "OTHER")
    collateral = payload.get("collateralValue") or 0
    occupation = profile.get("occupation", "GENERIC")

    avg_income = tx.get("avgIncome", 0)
    avg_expense = tx.get("avgExpense", 0)
    seasonal = tx.get("seasonalIncomeVariation", False)
    land_owned = rtc.get("landOwned", False)

    # ── 1. ArthScore ──────────────────────────────────────
    score_result = calculate_arth_score(payload)
    arth_score = score_result["arthScore"]
    emi = score_result["_emi"]
    disposable = score_result["_disposable"]
    dti = score_result["_dti"]

    # ── 2. Risk level ─────────────────────────────────────
    risk_level = _classify_risk(arth_score, dti)

    # ── 3. Eligible amount ────────────────────────────────
    eligible_amount = _calculate_eligible_amount(
        avg_income, avg_expense, arth_score, collateral, requested
    )

    # ── 4. Total payable ──────────────────────────────────
    total_payable = round(emi * tenure, 2)

    # ── 5. Repayment forecast ─────────────────────────────
    forecast = generate_forecast(
        principal=min(requested, eligible_amount),
        annual_rate=interest,
        tenure=tenure,
        avg_income=avg_income,
        seasonal_variation=seasonal,
    )

    # ── 6. Factor analysis ────────────────────────────────
    factors = _analyze_factors(
        avg_income, avg_expense, seasonal, land_owned,
        arth_score, dti, tx.get("totalTransactions", 0),
        profile.get("loanHistory", [])
    )

    # ── 7. AI-generated recommendation (GPT) ─────────────
    ai_recommendation = _generate_ai_recommendation(
        arth_score, risk_level, avg_income, emi,
        eligible_amount, purpose, occupation
    )

    # ── 8. Recommended products ───────────────────────────
    products = get_recommendations(occupation, requested, land_owned, arth_score)

    return {
        "arthScore": arth_score,
        "riskLevel": risk_level,
        "loanSummary": {
            "eligibleAmount": eligible_amount,
            "recommendedTenure": tenure,
            "monthlyEMI": emi,
            "interestRate": interest,
            "totalPayable": total_payable,
            "debtToIncomeRatio": dti,
        },
        "repaymentForecast": forecast,
        "positiveFactors": factors["positive"],
        "negativeFactors": factors["negative"],
        "riskFactors": factors["risk"],
        "recommendations": [ai_recommendation] if ai_recommendation else [],
        "recommendedProducts": products,
    }


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def _classify_risk(arth_score: int, dti: float) -> str:
    if arth_score >= 700 and dti <= 0.35:
        return "LOW"
    elif arth_score >= 500 and dti <= 0.50:
        return "MODERATE"
    elif arth_score >= 300:
        return "HIGH"
    else:
        return "VERY_HIGH"


def _calculate_eligible_amount(avg_income, avg_expense, arth_score,
                                collateral, requested) -> float:
    disposable = avg_income - avg_expense
    # Max EMI the person can afford = 40% of disposable
    max_emi = disposable * 0.40

    # Back-calculate max principal for 18 months at 12%
    r = 12 / 12 / 100
    n = 18
    if r > 0 and max_emi > 0:
        max_by_income = max_emi * ((1 + r) ** n - 1) / (r * (1 + r) ** n)
    else:
        max_by_income = 0

    # Collateral boost
    collateral_boost = collateral * 0.6 if collateral > 0 else 0

    # Score multiplier
    if arth_score >= 700:
        multiplier = 1.0
    elif arth_score >= 500:
        multiplier = 0.8
    elif arth_score >= 300:
        multiplier = 0.6
    else:
        multiplier = 0.4

    eligible = (max_by_income + collateral_boost) * multiplier

    # Cap at requested amount
    return round(min(eligible, requested), 2)


def _analyze_factors(avg_income, avg_expense, seasonal, land_owned,
                     arth_score, dti, total_tx, loan_history):
    positive, negative, risk = [], [], []

    if avg_income >= 20000:
        positive.append("Healthy monthly income level")
    if avg_expense / avg_income <= 0.5 if avg_income > 0 else False:
        positive.append("Good expense management")
    if land_owned:
        positive.append("Land collateral available — strengthens eligibility")
    if total_tx >= 20:
        positive.append("Consistent transaction history on ArthSaathi")
    if not loan_history:
        positive.append("No prior loan defaults detected")
    if arth_score >= 700:
        positive.append("Strong ArthScore above 700")
    if dti <= 0.30:
        positive.append("Low debt-to-income ratio")

    if seasonal:
        negative.append("Seasonal income variation detected — irregular cash flow")
    if avg_expense / avg_income >= 0.7 if avg_income > 0 else False:
        negative.append("High expense ratio reduces repayment capacity")
    if dti > 0.45:
        negative.append("EMI-to-income ratio is high")
    if total_tx < 10:
        negative.append("Limited transaction history — harder to assess reliability")
    if arth_score < 400:
        negative.append("Low ArthScore limits loan eligibility")

    if not loan_history:
        risk.append("No formal credit history — first-time borrower")
    if seasonal:
        risk.append("Income may drop during off-season months")
    if avg_income < 10000:
        risk.append("Low monthly income may strain repayment")

    return {"positive": positive, "negative": negative, "risk": risk}


def _generate_ai_recommendation(arth_score, risk_level, avg_income,
                                 emi, eligible_amount, purpose, occupation) -> str:
    try:
        prompt = f"""
You are ArthSaathi, a financial assistant for rural India. 
Write a 2-sentence loan recommendation in simple English for this user:
- ArthScore: {arth_score}/1000
- Risk: {risk_level}
- Monthly Income: ₹{avg_income}
- Monthly EMI: ₹{emi}
- Eligible Amount: ₹{eligible_amount}
- Loan Purpose: {purpose}
- Occupation: {occupation}

Be encouraging but honest. Mention one actionable tip.
"""
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback recommendation if GPT fails
        if risk_level == "LOW":
            return "Your financial profile looks strong. You are well-positioned to manage this loan responsibly."
        elif risk_level == "MODERATE":
            return "You can manage this loan with discipline. Try reducing monthly expenses by 10% before applying."
        else:
            return "Consider a smaller loan amount first to build your repayment track record."