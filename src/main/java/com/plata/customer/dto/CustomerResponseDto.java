package com.plata.customer.dto;

import java.util.UUID;

public record CustomerResponseDto(
        UUID id,
        String firstName,
        String lastName,
        String email
) {
}