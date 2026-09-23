package com.plata.account.service;

import com.plata.account.dto.AccountResponseDto;
import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.dto.DepositMoneyRequestDto;
import com.plata.account.dto.DepositMoneyResponseDto;

import java.util.List;
import java.util.UUID;

public interface AccountService {
    AccountResponseDto createAccount(UUID customerId, CreateAccountRequestDto accountDto);
    List<AccountResponseDto> listAccounts(UUID customerId);
    DepositMoneyResponseDto depositMoney(UUID customerId, UUID accountId , DepositMoneyRequestDto request);
}
