package com.plata.account.dto;

import com.plata.account.entity.Account;
import com.plata.account.enums.AccountStatus;
import com.plata.common.money.Currency;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;


public record AccountResponseDto(
        UUID id,
        Currency currency,
        String balance,
        AccountStatus status
) {
    public static AccountResponseDto from(Account account, BigDecimal balance) {
        return new AccountResponseDto(
                account.getId(),
                account.getCurrency(),
                balance.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                account.getStatus()
        );
    }
}
