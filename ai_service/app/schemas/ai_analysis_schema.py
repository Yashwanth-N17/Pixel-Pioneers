from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator


class FarmerDetails(BaseModel):
    primary_harvest_crops: list[str] = Field(min_length=1)
    monthly_cost_of_inputs: float = Field(ge=0)
    rtc_land_record_ocr_passed: bool


class GroceryShopDetails(BaseModel):
    initial_business_investment: float = Field(ge=0)
    supplier_credit_terms: Literal["Yes", "No"]
    inventory_turn_cycle: Literal["Weekly", "Monthly"]


class TailorDetails(BaseModel):
    machinery_asset_count: int = Field(ge=0)
    weekly_order_throughput_capacity: int = Field(ge=0)
    collects_advance_fabric_deposits: Literal["Yes", "No"]


class WorkerDetails(BaseModel):
    employment_stability_status: Literal[
        "Permanent Daily Wage", "Seasonal Laborer", "Gig Contractor"
    ]
    typical_working_days_per_month: int = Field(ge=0, le=31)
    primary_payment_channel: Literal[
        "Hand-to-Hand Cash", "Local Cooperative Bank", "MNREGA Job Account"
    ]


class FinancialAnalysisRequest(BaseModel):
    full_name: str = Field(min_length=2)
    mobile_number: str = Field(min_length=10, max_length=15)
    preferred_dialect: Literal["English", "Hindi", "Kannada", "Marathi", "Tamil", "Telugu"]
    user_occupation_profile: Literal["Farmer", "Grocery Shop", "Tailor", "Daily Wage Worker"]
    monthly_income_range_baseline: float = Field(ge=0)
    average_monthly_household_expenses: float = Field(ge=0)
    has_active_loans: Literal["Yes", "No"]
    past_repayment_habit: Literal["Never", "Sometimes", "Frequently"]

    farmer_details: Optional[FarmerDetails] = None
    grocery_shop_details: Optional[GroceryShopDetails] = None
    tailor_details: Optional[TailorDetails] = None
    worker_details: Optional[WorkerDetails] = None

    @model_validator(mode="after")
    def validate_selected_track(self):
        details = {
            "Farmer": self.farmer_details,
            "Grocery Shop": self.grocery_shop_details,
            "Tailor": self.tailor_details,
            "Daily Wage Worker": self.worker_details,
        }
        if details[self.user_occupation_profile] is None:
            raise ValueError(f"{self.user_occupation_profile} details are required")
        return self