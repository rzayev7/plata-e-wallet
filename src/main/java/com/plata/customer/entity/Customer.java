package com.plata.customer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;

@Entity
@Table(name = "customers")
@Getter
public class Customer {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerStatus status;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Customer() {
        // required by JPA
    }

    /**
     * The only way to create a customer.
     *
     * There are no public setters anywhere in this class: every field is set here,
     * under the rules that apply to a new customer. That is what keeps invalid
     * objects from existing at all.
     */
    public static Customer register(String email, String passwordHash, String firstName, String lastName) {
        Customer customer = new Customer();
        customer.id = UUID.randomUUID();
        customer.email = normalizeEmail(email);
        customer.passwordHash = passwordHash;
        customer.role = Role.CUSTOMER;
        customer.status = CustomerStatus.ACTIVE;
        customer.firstName = firstName;
        customer.lastName = lastName;
        customer.createdAt = Instant.now();
        return customer;
    }

    public boolean isActive() {
        return status == CustomerStatus.ACTIVE;
    }

    /** Stored lowercase so that "Bob@x.com" and "bob@x.com" are the same customer (BR-001). */
    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
