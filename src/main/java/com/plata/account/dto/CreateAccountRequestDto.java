package com.plata.account.dto;

import com.plata.common.money.Currency;
import lombok.Getter;

@Getter
public class CreateAccountRequestDto {

    private Currency currency;

}