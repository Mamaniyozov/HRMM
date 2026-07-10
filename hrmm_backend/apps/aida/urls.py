from django.urls import path

from apps.aida.views import (
    AidaChatStreamView,
    AidaChatView,
    AidaSessionDetailView,
    AidaSessionListView,
)

urlpatterns = [
    path("chat/", AidaChatView.as_view(), name="aida_chat"),
    path("chat/stream/", AidaChatStreamView.as_view(), name="aida_chat_stream"),
    path("sessions/", AidaSessionListView.as_view(), name="aida_session_list"),
    path("sessions/<uuid:session_id>/", AidaSessionDetailView.as_view(), name="aida_session_detail"),
]
