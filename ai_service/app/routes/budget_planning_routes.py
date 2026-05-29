from typing import Any

from fastapi import APIRouter

from app.services import budget_planning_service

router = APIRouter(tags=["budget-planning"])


@router.post("/budget-plan")
async def budget_plan(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.budget_plan(payload)


@router.post("/emergency-fund")
async def emergency_fund(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.emergency_fund(payload)


@router.post("/education-plan")
async def education_plan(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.education_plan(payload)


@router.post("/gold-plan")
async def gold_plan(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.gold_plan(payload)


@router.post("/cashflow-forecast")
async def cashflow_forecast(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.cashflow_forecast(payload)


@router.post("/seasonal-income")
async def seasonal_income(payload: dict[str, Any]) -> dict[str, Any]:
    return await budget_planning_service.seasonal_income(payload)
