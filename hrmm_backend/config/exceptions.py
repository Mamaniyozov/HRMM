from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    message = "Request failed"
    errors = response.data

    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = response.data["detail"]
        elif "non_field_errors" in response.data:
            non_field_errors = response.data["non_field_errors"]
            message = non_field_errors[0] if non_field_errors else message
        else:
            parts = []
            for field, value in response.data.items():
                if isinstance(value, list) and value:
                    parts.append(f"{field}: {value[0]}")
                elif isinstance(value, str):
                    parts.append(f"{field}: {value}")
            if parts:
                message = "; ".join(parts)
    elif isinstance(response.data, list) and response.data:
        message = response.data[0]

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    return response
