from app.analyzers.financial_health_analyzer import analyze_financial_health
from app.analyzers.spending_behavior_analyzer import analyze_spending_behavior
from app.analyzers.savings_predictor import predict_savings
from app.analyzers.loan_risk_engine import calculate_loan_risk
from app.analyzers.loan_score_analyzer import analyze_loan_request
from app.analyzers.occupation_analyzers import OCCUPATION_ANALYZERS
from app.analyzers.profile_classifier import classify_profile


def analyze_financial_signup(payload: dict) -> dict:
    financial_health = analyze_financial_health(payload)
    spending_behavior = analyze_spending_behavior(payload)
    savings_prediction = predict_savings(payload)
    loan_risk = calculate_loan_risk(payload, financial_health, spending_behavior)
    profile = classify_profile(payload)

    occupation = payload["user_occupation_profile"]
    detail_key, analyzer_fn = OCCUPATION_ANALYZERS[occupation]
    occupation_analysis = analyzer_fn(payload[detail_key])

    return {
        "profile": profile,
        "financial_health": financial_health,
        "spending_behavior": spending_behavior,
        "savings_prediction": savings_prediction,
        "loan_risk": loan_risk,
        "occupation_analysis": occupation_analysis,
    }


def analyze_loan_eligibility(payload: dict) -> dict:
    return analyze_loan_request(payload)


def analyze_signup_profile(payload: dict) -> dict:
    # Maps the /analyze endpoint payload (SignupAnalysisRequest shape)
    # to the shared financial signup analyzer
    mapped = {
        "monthly_income_range_baseline": payload["monthly_income_range_baseline"],
        "average_monthly_household_expenses": payload["average_monthly_household_expenses"],
        "has_active_loans": payload["has_active_loans"],
        "past_repayment_habit": payload["past_repayment_habit"],
        "user_occupation_profile": payload["user_occupation_profile"],
        "farmer_details": payload.get("farmer_details"),
        "grocery_shop_details": payload.get("grocery_shop_details"),
        "tailor_details": payload.get("tailor_details"),
        "worker_details": payload.get("worker_details"),
    }
    return analyze_financial_signup(mapped)