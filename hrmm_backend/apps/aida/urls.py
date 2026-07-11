from django.urls import path

from apps.aida.views import (
    AidaChatStreamView,
    AidaChatView,
    AidaConversationDetailView,
    AidaConversationListCreateView,
)

urlpatterns = [
    path("chat/", AidaChatView.as_view(), name="aida_chat"),
    path("chat/stream/", AidaChatStreamView.as_view(), name="aida_chat_stream"),
    path("conversations/", AidaConversationListCreateView.as_view(), name="aida_conversation_list"),
    path("conversations/<uuid:conversation_id>/", AidaConversationDetailView.as_view(), name="aida_conversation_detail"),
]
