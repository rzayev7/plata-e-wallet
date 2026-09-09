package com.plata.customer.dto;

import com.plata.customer.entity.Customer;
import java.util.UUID;

/**
 * What the API returns. Note what is NOT here: passwordHash.
 * This is the reason entities never leave the service layer.
 */
public record CustomerResponse(
        UUID id,
        String email,
        String firstName,
        String lastName
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getEmail(),
                customer.getFirstName(),
                customer.getLastName()
        );
    }
}
