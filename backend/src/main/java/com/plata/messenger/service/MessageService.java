package com.plata.messenger.service;

import com.plata.messenger.entity.Message;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    Message sendMessage(UUID senderId, UUID recipientId, String content);
    List<Message> getConversation(UUID userA, UUID userB);
}
