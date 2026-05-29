from enum import Enum


class Occupation(str, Enum):
    FARMER = "Farmer"
    GROCERY_SHOP = "Grocery Shop"
    TAILOR = "Tailor"
    DAILY_WAGE_WORKER = "Daily Wage Worker"


class Dialect(str, Enum):
    ENGLISH = "English"
    HINDI = "Hindi"
    KANNADA = "Kannada"
    MARATHI = "Marathi"
    TAMIL = "Tamil"
    TELUGU = "Telugu"


class YesNo(str, Enum):
    YES = "Yes"
    NO = "No"


class RepaymentHabit(str, Enum):
    NEVER = "Never"
    SOMETIMES = "Sometimes"
    FREQUENTLY = "Frequently"


class RiskBand(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"


SUPPORTED_CROPS = {"Paddy", "Ragi", "Sugarcane", "Vegetables"}

EMPLOYMENT_STABILITY_OPTIONS = {
    "Permanent Daily Wage",
    "Seasonal Laborer",
    "Gig Contractor",
}

PAYMENT_CHANNEL_OPTIONS = {
    "Hand-to-Hand Cash",
    "Local Cooperative Bank",
    "MNREGA Job Account",
}