package com.plata.account.dto;

import com.plata.common.money.Currency;

import java.util.UUID;

public record WithdrawMoneyResponseDto(
        UUID accountId,
        Long balance,
        Currency currency
) {
}
