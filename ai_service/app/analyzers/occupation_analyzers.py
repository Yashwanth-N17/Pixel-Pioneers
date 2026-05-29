from app.analyzers.common import band_from_thresholds


def analyze_farmer(details: dict) -> dict:
    return {
        "track": "Farmer",
        "crop_mix": details["primary_harvest_crops"],
        "input_cost_band": band_from_thresholds(
            details["monthly_cost_of_inputs"],
            ((7999, "Low"), (20000, "Medium"), (999999999, "High")),
        ),
        "document_confidence": {
            True: "Verified",
            False: "Needs Manual Review",
        }[details["rtc_land_record_ocr_passed"]],
        "dashboard_signal": "Farm seasonality and RTC verification available.",
    }


def analyze_grocery(details: dict) -> dict:
    return {
        "track": "Grocery Shop",
        "business_scale": band_from_thresholds(
            details["initial_business_investment"],
            ((74999, "Micro Store"), (199999, "Growing Store"), (999999999, "Established Store")),
        ),
        "inventory_cash_cycle": {
            "Weekly": "Fast",
            "Monthly": "Moderate",
        }[details["inventory_turn_cycle"]],
        "supplier_credit_dependency": {
            "Yes": "Present",
            "No": "Low",
        }[details["supplier_credit_terms"]],
        "dashboard_signal": "Inventory cycle and supplier credit exposure available.",
    }


def analyze_tailor(details: dict) -> dict:
    return {
        "track": "Tailor",
        "machinery_asset_band": band_from_thresholds(
            details["machinery_asset_count"],
            ((0, "No Machinery Asset"), (2, "Basic Asset Base"), (999999999, "Strong Asset Base")),
        ),
        "weekly_throughput_band": band_from_thresholds(
            details["weekly_order_throughput_capacity"],
            ((19, "Low Capacity"), (49, "Stable Capacity"), (999999999, "High Capacity")),
        ),
        "working_capital_buffer": {
            "Yes": "Protected",
            "No": "Unprotected",
        }[details["collects_advance_fabric_deposits"]],
        "dashboard_signal": "Machine assets and weekly order capacity available.",
    }


def analyze_worker(details: dict) -> dict:
    return {
        "track": "Daily Wage Worker",
        "work_consistency": band_from_thresholds(
            details["typical_working_days_per_month"],
            ((17, "Low"), (23, "Moderate"), (31, "High")),
        ),
        "income_predictability": details["employment_stability_status"],
        "banking_visibility": {
            "Hand-to-Hand Cash": "Low",
            "Local Cooperative Bank": "High",
            "MNREGA Job Account": "High",
        }[details["primary_payment_channel"]],
        "dashboard_signal": "Workday consistency and payment-channel visibility available.",
    }


OCCUPATION_ANALYZERS = {
    "Farmer": ("farmer_details", analyze_farmer),
    "Grocery Shop": ("grocery_shop_details", analyze_grocery),
    "Tailor": ("tailor_details", analyze_tailor),
    "Daily Wage Worker": ("worker_details", analyze_worker),
}