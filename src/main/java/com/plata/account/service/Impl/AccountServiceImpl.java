package com.plata.account.service.Impl;

import com.plata.account.dto.*;
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

    public WithdrawMoneyResponseDto withdrawMoney(UUID customerId, UUID accountId, WithdrawMoneyRequestDto requestDto){
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));
        if(!Objects.equals(account.getOwnerId(),customerId)) {
            throw new AccountNotFoundException(accountId);
        }
        account.withdraw(requestDto.amount());
        accountRepository.save(account);
        return new WithdrawMoneyResponseDto(accountId,account.getBalance(),account.getCurrency());
    }

    public TransferMoneyResponseDto transferMoney(UUID customerId, UUID sourceAccountId, TransferMoneyRequestDto requestDto){
        Account account1 = accountRepository.findById(sourceAccountId)
                .orElseThrow(() -> new AccountNotFoundException(sourceAccountId));

        Account account2 = accountRepository.findById(requestDto.destinationAccountId())
                .orElseThrow(() -> new AccountNotFoundException(requestDto.destinationAccountId()));

        if(!Objects.equals(account1.getOwnerId(),customerId)) {
            throw new AccountNotFoundException(sourceAccountId);
        }

        account1.withdraw(requestDto.amount());
        account2.deposit(requestDto.amount());
        accountRepository.save(account1);
        accountRepository.save(account2);
        TransferMoneyResponseDto transferMoneyResponseDto = new TransferMoneyResponseDto("Transfer completed successfully");
        return transferMoneyResponseDto;
    }


    private static final int MINOR_UNITS = 2;

    private BigDecimal balanceOf(Account account) {
        return BigDecimal.valueOf(account.getBalance()).movePointLeft(MINOR_UNITS);
    }
}
