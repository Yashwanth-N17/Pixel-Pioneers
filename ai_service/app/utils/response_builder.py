def success_response(data: dict, message: str = "Success") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str, code: int = 400) -> dict:
    return {
        "success": False,
        "message": message,
        "code": code,
    }