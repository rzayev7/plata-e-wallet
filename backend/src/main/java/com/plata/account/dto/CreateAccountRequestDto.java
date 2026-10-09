package com.plata.account.dto;

import com.plata.common.money.Currency;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class CreateAccountRequestDto {

    @NotNull(message = "Currency is required")
    private Currency currency;

}