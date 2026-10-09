package com.plata.messenger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.plata.common.security.JwtService;
import com.plata.messenger.dto.ChatMessageDto;
import com.plata.messenger.entity.Message;
import com.plata.messenger.service.MessageService;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Each connection authenticates once, via a {@code ?token=} query param (a browser
 * WebSocket can't send an Authorization header), then is kept in a per-customer
 * session list so an incoming chat message can be routed to sender + recipient only.
 */
@Component
public class ChatHandler extends TextWebSocketHandler {

    private static final String CUSTOMER_ID_ATTRIBUTE = "customerId";

    private final JwtService jwtService;
    private final MessageService messageService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final Map<UUID, List<WebSocketSession>> sessionsByCustomer = new ConcurrentHashMap<>();

    public ChatHandler(JwtService jwtService, MessageService messageService) {
        this.jwtService = jwtService;
        this.messageService = messageService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID customerId = resolveCustomerId(session);
        if (customerId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        session.getAttributes().put(CUSTOMER_ID_ATTRIBUTE, customerId);
        sessionsByCustomer.computeIfAbsent(customerId, id -> new CopyOnWriteArrayList<>()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws Exception {
        UUID senderId = (UUID) session.getAttributes().get(CUSTOMER_ID_ATTRIBUTE);
        if (senderId == null) {
            return;
        }

        ChatMessageDto incoming = objectMapper.readValue(textMessage.getPayload(), ChatMessageDto.class);
        Message saved = messageService.sendMessage(senderId, incoming.recipientId(), incoming.content());

        TextMessage outgoing = new TextMessage(objectMapper.writeValueAsString(new ChatMessageDto(
                saved.getId(), saved.getSenderId(), saved.getRecipientId(), saved.getContent(), saved.getCreatedAt()
        )));

        sendTo(saved.getSenderId(), outgoing);
        sendTo(saved.getRecipientId(), outgoing);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID customerId = (UUID) session.getAttributes().get(CUSTOMER_ID_ATTRIBUTE);
        if (customerId != null) {
            List<WebSocketSession> sessions = sessionsByCustomer.get(customerId);
            if (sessions != null) {
                sessions.remove(session);
            }
        }
    }

    private void sendTo(UUID customerId, TextMessage message) {
        List<WebSocketSession> sessions = sessionsByCustomer.get(customerId);
        if (sessions == null) {
            return;
        }
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (Exception ignored) {
                    // a dead session will be cleaned up by afterConnectionClosed
                }
            }
        }
    }

    private UUID resolveCustomerId(WebSocketSession session) {
        String query = session.getUri() == null ? null : session.getUri().getQuery();
        if (query == null) {
            return null;
        }
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2 && pair[0].equals("token")) {
                try {
                    return UUID.fromString(jwtService.parse(pair[1]).getSubject());
                } catch (JwtException | IllegalArgumentException e) {
                    return null;
                }
            }
        }
        return null;
    }
}
