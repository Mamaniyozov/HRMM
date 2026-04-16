from django.http import HttpResponse


class SimpleCORSMiddleware:
    ALLOWED_ORIGINS = {
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    }
    ALLOWED_HEADERS = "Authorization, Content-Type"
    ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")

        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if origin in self.ALLOWED_ORIGINS:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Headers"] = self.ALLOWED_HEADERS
            response["Access-Control-Allow-Methods"] = self.ALLOWED_METHODS

        return response
