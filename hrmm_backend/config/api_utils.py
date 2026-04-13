from math import ceil

from rest_framework.response import Response


def paginate_queryset(request, queryset, serializer_class, *, context=None):
    try:
        page = max(int(request.query_params.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1

    try:
        page_size = int(request.query_params.get("page_size", 10))
    except (TypeError, ValueError):
        page_size = 10

    page_size = min(max(page_size, 1), 100)
    total = queryset.count()
    total_pages = ceil(total / page_size) if total else 1
    start = (page - 1) * page_size
    end = start + page_size

    serializer = serializer_class(queryset[start:end], many=True, context=context or {})
    return Response(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "results": serializer.data,
        }
    )
