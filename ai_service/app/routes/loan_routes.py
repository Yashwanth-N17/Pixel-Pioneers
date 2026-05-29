# ai_service/app/routes/loan_routes.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.loan.loan_analysis_service import analyze_loan

router = APIRouter(prefix="/loan", tags=["Loan Intelligence"])


class LoanAnalysisRequest(BaseModel):
    requestedLoanAmount: float
    expectedInterestRate: float
    tenureMonths: int
    loanPurpose: Optional[str] = "OTHER"
    collateralValue: Optional[float] = None
    userProfile: Optional[dict] = {}


@router.post("/analyze")
def loan_analyze(request: LoanAnalysisRequest):
    return analyze_loan(request.dict())