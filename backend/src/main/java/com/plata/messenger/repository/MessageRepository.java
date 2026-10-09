package com.plata.messenger.repository;

import com.plata.messenger.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("""
        SELECT m FROM Message m
        WHERE (m.senderId = :userA AND m.recipientId = :userB)
           OR (m.senderId = :userB AND m.recipientId = :userA)
        ORDER BY m.createdAt ASC
        """)
    List<Message> findConversation(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
