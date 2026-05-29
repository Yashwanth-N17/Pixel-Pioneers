from typing import Any


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def band_from_thresholds(value: float, thresholds: tuple[tuple[float, Any], ...]) -> Any:
    return next(label for limit, label in thresholds if value <= limit)