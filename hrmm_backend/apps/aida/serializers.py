from rest_framework import serializers

from apps.aida.models import ChatMessage, ChatSession


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000, required=True)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    current_page = serializers.CharField(max_length=200, required=False, default="")
    current_report_id = serializers.UUIDField(required=False, allow_null=True)
    voice_mode = serializers.BooleanField(required=False, default=False)


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "role", "content", "tool_calls", "language", "voice_mode", "current_page", "created_at")
        read_only_fields = ("id", "created_at")


class ConversationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ("id", "title", "updated_at")


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ("id", "title", "is_active", "message_count", "messages", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def get_message_count(self, obj):
        return obj.messages.count()
