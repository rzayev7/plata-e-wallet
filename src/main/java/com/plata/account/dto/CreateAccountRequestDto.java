package com.plata.account.dto;

import com.plata.account.enums.Currency;
import lombok.Getter;

@Getter
public class CreateAccountRequestDto {

    private Currency currency;

}