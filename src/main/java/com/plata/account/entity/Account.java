package com.plata.account.entity;

import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.enums.AccountStatus;
import com.plata.account.enums.Currency;
import com.plata.wallet.entity.Wallet;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Setter;

@Entity
@Setter
@Table(name = "accounts")
public  class Account{
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "wallet_id",nullable = false)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Currency currency;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status;

    public static Account createAccount(CreateAccountRequestDto dto){
        Account account = new Account();
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency(dto.getCurrency());
        account.setStatus(AccountStatus.ACTIVE);
        return account;
    }
}