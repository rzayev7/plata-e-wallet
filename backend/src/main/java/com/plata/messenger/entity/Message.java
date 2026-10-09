package com.plata.messenger.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Getter
@Table(name = "messages")
public class Message {

    @Id
    private UUID id;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Message() {
    }

    public Message(UUID senderId, UUID recipientId, String content) {
        this.id = UUID.randomUUID();
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.createdAt = OffsetDateTime.now();
    }
}
