package com.plata.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record TransferMoneyRequestDto(
        UUID destinationAccountId,
        @NotNull
        @Positive(message = "Transfer amount must be greater than zero")
        Long amount
) {
}
