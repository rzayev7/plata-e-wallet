package com.plata.account.dto;

import java.util.UUID;

public record TransferMoneyResponseDto(
        Long amount,
        UUID sourceAccId,
        UUID destinationAccId,
        long sourceAccBalance,
        long destinationAccBalance
) {
}
