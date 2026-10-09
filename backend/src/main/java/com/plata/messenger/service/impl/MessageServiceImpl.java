package com.plata.messenger.service.impl;

import com.plata.messenger.entity.Message;
import com.plata.messenger.repository.MessageRepository;
import com.plata.messenger.service.MessageService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;

    @Override
    public Message sendMessage(UUID senderId, UUID recipientId, String content){
        Message message = new Message(senderId,recipientId,content);
        return messageRepository.save(message);
    }

    @Override
    public List<Message> getConversation(UUID userA, UUID userB) {
        return messageRepository.findConversation(userA, userB);
    }
}
