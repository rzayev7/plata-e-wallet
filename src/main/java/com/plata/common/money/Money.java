package com.plata.common.money;

import java.math.BigDecimal;

public class Money {
    private final long amount;
    private final Currency currency;

    private Money(long amount, Currency currency){
        this.amount = amount;
        this.currency = currency;
    }

    public long amount() {
        return amount;
    }

    public Currency currency() {
        return currency;
    }

}
