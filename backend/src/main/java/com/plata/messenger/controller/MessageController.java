package com.plata.messenger.controller;

import com.plata.messenger.dto.ChatMessageDto;
import com.plata.messenger.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@Tag(
        name = "Messages",
        description = "Direct messages between customers"
)
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @Operation(
            summary = "Get conversation history",
            description = "Returns all messages exchanged with the given customer, oldest first"
    )
    @GetMapping("/{otherCustomerId}")
    public List<ChatMessageDto> getConversation(@AuthenticationPrincipal UUID customerId, @PathVariable UUID otherCustomerId) {
        return messageService.getConversation(customerId, otherCustomerId).stream()
                .map(m -> new ChatMessageDto(m.getId(), m.getSenderId(), m.getRecipientId(), m.getContent(), m.getCreatedAt()))
                .toList();
    }
}
