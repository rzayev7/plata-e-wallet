package com.plata.transfer.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transfer")
@Getter
@Setter
public class Transfer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID fromWhichAccountId;
    private UUID toWhichAccountId;

    @Column(name = "transfer_amount", nullable = false)
    private Long amount;

    @CreationTimestamp
    private Instant createdAt;
}

