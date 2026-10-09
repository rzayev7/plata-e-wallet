package com.plata.account.dto;

import com.plata.common.money.Currency;

import java.math.BigDecimal;
import java.util.UUID;

public record DepositMoneyResponseDto(
        UUID accountId,
        Long balance,
        Currency currency
) {
}