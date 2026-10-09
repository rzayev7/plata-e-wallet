package com.plata.messenger.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessageDto(
        UUID id,
        UUID senderId,
        UUID recipientId,
        String content,
        OffsetDateTime createdAt
) {
}
