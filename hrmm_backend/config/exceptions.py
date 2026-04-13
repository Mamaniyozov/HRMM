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
            message = response.data["non_field_errors"][0]
    elif isinstance(response.data, list) and response.data:
        message = response.data[0]

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    return response
