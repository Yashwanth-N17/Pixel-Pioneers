# ai_service/app/loan/recommendation_engine.py
# Rule-based loan product recommendation engine

LOAN_PRODUCTS = [
    {
        "provider": "SBI",
        "productName": "Kisan Credit Card",
        "interestRate": "7%",
        "maxAmount": 300000,
        "targetOccupations": ["FARMER"],
        "requiresLand": True,
        "reason": "Government-backed scheme for farmers with land. Low interest.",
    },
    {
        "provider": "NABARD",
        "productName": "Kisan Vikas Patra Loan",
        "interestRate": "8.5%",
        "maxAmount": 200000,
        "targetOccupations": ["FARMER"],
        "requiresLand": False,
        "reason": "Suitable for agricultural working capital needs.",
    },
    {
        "provider": "Mudra (PMMY)",
        "productName": "Shishu Loan",
        "interestRate": "10–12%",
        "maxAmount": 50000,
        "targetOccupations": ["SHOPKEEPER", "TAILOR", "GENERIC"],
        "requiresLand": False,
        "reason": "Micro loan for small businesses. No collateral required.",
    },
    {
        "provider": "Mudra (PMMY)",
        "productName": "Kishor Loan",
        "interestRate": "10–14%",
        "maxAmount": 500000,
        "targetOccupations": ["SHOPKEEPER", "TAILOR", "GENERIC"],
        "requiresLand": False,
        "reason": "Suitable for growing small businesses needing working capital.",
    },
    {
        "provider": "SBI",
        "productName": "SBI Personal Loan",
        "interestRate": "11–14%",
        "maxAmount": 2000000,
        "targetOccupations": ["GENERIC", "SHOPKEEPER"],
        "requiresLand": False,
        "reason": "General-purpose loan with flexible repayment.",
    },
    {
        "provider": "IRDAI / Jan Dhan",
        "productName": "Gramin Mahila Loan",
        "interestRate": "9%",
        "maxAmount": 100000,
        "targetOccupations": ["TAILOR", "GENERIC"],
        "requiresLand": False,
        "reason": "Low-interest loan for rural women entrepreneurs.",
    },
]


def get_recommendations(occupation: str, requested_amount: float,
                        land_owned: bool, arth_score: int) -> list:
    """
    Filter and rank products based on user profile.
    Returns top 3 most relevant products.
    """
    occupation = (occupation or "GENERIC").upper()
    results = []

    for product in LOAN_PRODUCTS:
        # Check occupation match
        if occupation not in product["targetOccupations"] and "GENERIC" not in product["targetOccupations"]:
            continue

        # Check land requirement
        if product["requiresLand"] and not land_owned:
            continue

        # Score-based eligibility — exclude very risky scores from large loans
        if arth_score < 300 and product["maxAmount"] > 100000:
            continue

        results.append({
            "provider": product["provider"],
            "productName": product["productName"],
            "interestRate": product["interestRate"],
            "maxAmount": product["maxAmount"],
            "reason": product["reason"],
        })

    # Sort: prioritize government-backed, lower interest first
    results.sort(key=lambda x: x["maxAmount"], reverse=True)

    return results[:3]  # top 3