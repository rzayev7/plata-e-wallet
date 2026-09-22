package com.plata.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

public record DepositMoneyRequestDto(
        @NotNull
        @DecimalMin(value = "0.01", message = "Deposit amount must be greater than zero")
        Long amount
) {
}