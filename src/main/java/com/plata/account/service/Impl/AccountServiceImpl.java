package com.plata.account.service.Impl;

import com.plata.account.dto.AccountResponseDto;
import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.dto.DepositMoneyRequestDto;
import com.plata.account.dto.DepositMoneyResponseDto;
import com.plata.account.entity.Account;
import com.plata.account.exception.AccountNotFoundException;
import com.plata.account.repository.AccountRepository;
import com.plata.account.service.AccountService;
import com.plata.common.money.Money;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@AllArgsConstructor
public class AccountServiceImpl implements AccountService {
    AccountRepository accountRepository;

    @Override
    public AccountResponseDto createAccount(UUID customerId, CreateAccountRequestDto accountDto) {
        Account account = accountRepository.save(Account.createAccount(accountDto, customerId));
        return AccountResponseDto.from(account, balanceOf(account));
    }

    @Override
    public List<AccountResponseDto> listAccounts(UUID customerId) {
        return accountRepository.findAllByOwnerId(customerId).stream()
                .map(account -> AccountResponseDto.from(account, balanceOf(account)))
                .toList();
    }

    @Transactional
    @Override
    public DepositMoneyResponseDto depositMoney(UUID customerId, UUID accountId, DepositMoneyRequestDto request){
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));
        if (!Objects.equals(account.getOwnerId(), customerId)) {
            throw new AccountNotFoundException(accountId);
        }
        account.deposit(request.amount());
        accountRepository.save(account);
        return new DepositMoneyResponseDto(accountId,account.getBalance(),account.getCurrency());
    }

    private static final int MINOR_UNITS = 2;

    private BigDecimal balanceOf(Account account) {
        return BigDecimal.valueOf(account.getBalance()).movePointLeft(MINOR_UNITS);
    }
}
