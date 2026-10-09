package com.plata.account.service.Impl;

import com.plata.account.dto.*;
import com.plata.account.entity.Account;
import com.plata.account.exception.AccountNotFoundException;
import com.plata.account.exception.NotSameCurrencyException;
import com.plata.account.exception.SameAccountTransferException;
import com.plata.account.repository.AccountRepository;
import com.plata.account.service.AccountService;
import com.plata.common.money.Money;
import com.plata.transfer.entity.Transfer;
import com.plata.transfer.repository.TransferRepository;
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
    TransferRepository transferRepository;

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

    @Transactional
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
    @Transactional
    public TransferMoneyResponseDto transferMoney(UUID customerId, UUID sourceAccountId, TransferMoneyRequestDto requestDto){
        if(Objects.equals(sourceAccountId,requestDto.destinationAccountId())){
            throw new SameAccountTransferException(sourceAccountId);
        }

        Account account1 = accountRepository.findById(sourceAccountId)
                .orElseThrow(() -> new AccountNotFoundException(sourceAccountId));

        Account account2 = accountRepository.findById(requestDto.destinationAccountId())
                .orElseThrow(() -> new AccountNotFoundException(requestDto.destinationAccountId()));

        if(!Objects.equals(account1.getOwnerId(),customerId)) {
            throw new AccountNotFoundException(sourceAccountId);
        }
        if(!Objects.equals(account1.getCurrency(),account2.getCurrency())){
            throw new NotSameCurrencyException();
        }

        Transfer transfer = new Transfer();
        transfer.setFromWhichAccountId(sourceAccountId);
        transfer.setToWhichAccountId(requestDto.destinationAccountId());
        transfer.setAmount(requestDto.amount());
        
        account1.withdraw(requestDto.amount());
        account2.deposit(requestDto.amount());

        transferRepository.save(transfer);
        accountRepository.save(account1);
        accountRepository.save(account2);
        TransferMoneyResponseDto transferMoneyResponseDto = new TransferMoneyResponseDto(requestDto.amount(),account1.getId(),requestDto.destinationAccountId(),account1.getBalance(),account2.getBalance());
        return transferMoneyResponseDto;
    }


    private static final int MINOR_UNITS = 2;

    private BigDecimal balanceOf(Account account) {
        return BigDecimal.valueOf(account.getBalance()).movePointLeft(MINOR_UNITS);
    }
}
