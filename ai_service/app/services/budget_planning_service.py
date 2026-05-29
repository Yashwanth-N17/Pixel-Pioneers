import json
import math
from typing import Any

try:
    from groq import AsyncGroq
except ImportError:  # pragma: no cover - allows local boot without optional AI SDK
    AsyncGroq = None

from app.core.config import settings


DEFAULT_MODEL = "llama-3.3-70b-versatile"


def _num(value: Any, fallback: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _expense_total(expenses: Any) -> float:
    if isinstance(expenses, dict):
        return sum(_num(value) for value in expenses.values())
    if isinstance(expenses, list):
        return sum(_num(item.get("amount")) for item in expenses if isinstance(item, dict))
    return _num(expenses)


def _json_prompt(task: str, payload: dict[str, Any], shape: dict[str, Any]) -> str:
    return (
        "You are a rural financial planning assistant for Indian households. "
        "Return JSON only. Use simple, practical recommendations. "
        "Do not include monthly reports or financial health scores.\n\n"
        f"Task: {task}\n"
        f"Required JSON shape example: {json.dumps(shape)}\n"
        f"Input: {json.dumps(payload)}"
    )


async def _ask_groq(task: str, payload: dict[str, Any], shape: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.GROQ_API_KEY or AsyncGroq is None:
        return None

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    response = await client.chat.completions.create(
        model=settings.GROQ_BUDGET_MODEL or DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": "Return strict JSON only."},
            {"role": "user", "content": _json_prompt(task, payload, shape)},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


async def budget_plan(payload: dict[str, Any]) -> dict[str, Any]:
    income = _num(payload.get("income"))
    expenses = payload.get("expenses", {})
    total_expenses = _expense_total(expenses)
    recommended = max(0, round(income * 0.2))
    fallback = {
        "recommendedSavings": recommended,
        "budgetBreakdown": {
            "essentials": round(income * 0.55),
            "livelihood": round(income * 0.2),
            "savings": recommended,
            "flexible": max(0, round(income * 0.05)),
        },
        "warnings": [
            warning
            for warning in [
                "Expenses are higher than income." if total_expenses > income else "",
                "Savings are below recommended level." if income - total_expenses < recommended else "",
            ]
            if warning
        ],
        "recommendations": [
            "Save first when income arrives.",
            "Set category limits before market day.",
            "Keep emergency money separate from daily cash.",
        ],
        "suggestedCategoryLimits": {
            "food": round(income * 0.25),
            "farming": round(income * 0.2),
            "healthcare": round(income * 0.08),
            "education": round(income * 0.1),
            "loan_repayment": round(income * 0.15),
            "transport": round(income * 0.07),
            "utilities": round(income * 0.05),
            "miscellaneous": round(income * 0.1),
        },
    }
    return await _ask_groq("AI Budget Planner", payload, fallback) or fallback


async def emergency_fund(payload: dict[str, Any]) -> dict[str, Any]:
    expenses = _num(payload.get("monthlyExpenses", payload.get("expenses")))
    current = _num(payload.get("currentSaved"))
    reserve_months = min(6, max(3, int(_num(payload.get("reserveMonths"), 6))))
    reserve = round(expenses * reserve_months)
    monthly = max(0, math.ceil((reserve - current) / max(1, int(_num(payload.get("monthsToBuild"), 12)))))
    fallback = {
        "reserveTarget": reserve,
        "monthlySavingsTarget": monthly,
        "recommendations": ["Build 3-6 months of expenses step by step."],
        "warnings": ["Emergency fund is below one month expenses."] if current < expenses else [],
    }
    return await _ask_groq("Emergency Fund Recommendation", payload, fallback) or fallback


async def education_plan(payload: dict[str, Any]) -> dict[str, Any]:
    target = _num(payload.get("targetAmount"))
    years = max(1, int(_num(payload.get("yearsRemaining"), _num(payload.get("targetYear"), 2027) - 2026)))
    future_cost = round(target * ((1.08) ** years))
    fallback = {
        "monthlySavingsNeeded": math.ceil(future_cost / (years * 12)),
        "estimatedFutureCost": future_cost,
        "strategy": [
            "Use a fixed monthly savings amount.",
            "Increase savings after harvest or festival income.",
        ],
    }
    return await _ask_groq("Education Savings Recommendation", payload, fallback) or fallback


async def gold_plan(payload: dict[str, Any]) -> dict[str, Any]:
    savings = _num(payload.get("savingsAmount"))
    price = max(1, _num(payload.get("goldPrice"), 7200))
    grams = round(savings / price, 3)
    fallback = {
        "goldEquivalent": grams,
        "estimatedGrowth": round(savings * 1.08),
        "recommendations": ["Buy small amounts regularly and keep receipts safely."],
    }
    return await _ask_groq("Gold Savings Recommendation", payload, fallback) or fallback


async def cashflow_forecast(payload: dict[str, Any]) -> dict[str, Any]:
    income = _num(payload.get("income"))
    expenses = _num(payload.get("expenses"))
    balance = _num(payload.get("currentBalance"))
    predicted = round(balance + income - expenses)
    fallback = {
        "predictedBalance": predicted,
        "bestCase": round(predicted + income * 0.1),
        "worstCase": round(predicted - expenses * 0.15),
        "warnings": ["Possible deficit next month."] if predicted < 0 else [],
    }
    return await _ask_groq("Cash Flow Forecasting", payload, fallback) or fallback


async def seasonal_income(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = {
        "highIncomeMonths": payload.get("highIncomeMonths") or ["October", "November"],
        "lowIncomeMonths": payload.get("lowIncomeMonths") or ["June", "July"],
        "riskPeriods": payload.get("riskPeriods") or ["Before harvest"],
        "recommendations": [
            "Save extra in high-income months.",
            "Avoid new debt during low-income periods.",
        ],
    }
    return await _ask_groq("Seasonal Income Prediction", payload, fallback) or fallback
