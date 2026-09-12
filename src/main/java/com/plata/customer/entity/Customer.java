package com.plata.customer.entity;

import com.plata.customer.enums.CustomerRole;
import com.plata.customer.enums.CustomerStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerStatus status;

    @Column(length = 100)
    private String firstName;

    @Column(length = 100)
    private String lastName;

    @Column(length = 30)
    private String phoneNumber;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Customer(){}

    public static Customer create(String firstName, String lastName, String email, String phoneNumber, String rawPassword) {
        Customer customer = new Customer();

        customer.firstName = firstName;
        customer.lastName = lastName;
        customer.role = CustomerRole.USER;
        customer.status = CustomerStatus.ACTIVE;
        customer.phoneNumber = phoneNumber;
        customer.passwordHash = rawPassword;
        customer.email = email;

        return  customer;
    }
}