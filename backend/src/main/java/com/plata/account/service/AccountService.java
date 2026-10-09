package com.plata.account.service;

import com.plata.account.dto.*;

import java.util.List;
import java.util.UUID;

public interface AccountService {
    AccountResponseDto createAccount(UUID customerId, CreateAccountRequestDto accountDto);
    List<AccountResponseDto> listAccounts(UUID customerId);
    DepositMoneyResponseDto depositMoney(UUID customerId, UUID accountId , DepositMoneyRequestDto request);
    WithdrawMoneyResponseDto withdrawMoney(UUID customerId, UUID accountId , WithdrawMoneyRequestDto requestDto);
    TransferMoneyResponseDto transferMoney(UUID customerId, UUID sourceAccountId, TransferMoneyRequestDto requestDto);
}
