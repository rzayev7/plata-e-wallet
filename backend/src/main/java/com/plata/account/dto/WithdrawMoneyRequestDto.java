package com.plata.account.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WithdrawMoneyRequestDto (
        @NotNull
        @Positive(message = "Withdraw amount must be greater than zero")
        Long amount
){}
