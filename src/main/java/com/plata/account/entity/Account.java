package com.plata.account.entity;

import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.enums.AccountStatus;
import com.plata.account.enums.AccountType;
import com.plata.common.money.Currency;
import com.plata.common.money.Money;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Setter
@Getter
@Table(name = "accounts")
public  class Account{
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType type;

    @Column(name = "balance", nullable = false)
    private long balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Currency currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status;

    public static Account createAccount(CreateAccountRequestDto dto, UUID ownerId){
        Account account = new Account();
        account.setOwnerId(ownerId);
        account.setType(AccountType.CUSTOMER);
        account.setCurrency(dto.getCurrency());
        account.setStatus(AccountStatus.ACTIVE);
        return account;
    }

    public void deposit(Long amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Credit amount must be greater than zero");
        }
        this.balance += amount;
    }
}