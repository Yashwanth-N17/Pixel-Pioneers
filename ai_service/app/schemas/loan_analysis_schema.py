from typing import Literal
from pydantic import BaseModel, Field, model_validator


class LoanAnalysisRequest(BaseModel):
    applicant_id: str | None = None
    applicant_name: str = Field(min_length=2)
    occupation: Literal["Farmer", "Grocery Shop", "Tailor", "Daily Wage Worker"]

    loan_purpose: Literal["Agriculture", "Business", "Emergency", "Education"]
    amount_needed: float = Field(gt=0)
    repayment_period_months: int = Field(ge=3, le=60)

    current_income: float = Field(gt=0)
    average_monthly_expenses: float = Field(ge=0)
    existing_loans: Literal["Yes", "No"]
    existing_monthly_emi: float = Field(default=0, ge=0)

    collateral: Literal["Land", "Gold", "None"]
    past_repayment_habit: Literal["Never", "Sometimes", "Frequently"] = "Never"
    regular_sms_transactions: bool = True
    irregular_income_months: int = Field(default=0, ge=0, le=12)

    @model_validator(mode="after")
    def validate_existing_emi(self):
        if self.existing_loans == "No" and self.existing_monthly_emi != 0:
            raise ValueError("existing_monthly_emi must be 0 when existing_loans is No")
        return self