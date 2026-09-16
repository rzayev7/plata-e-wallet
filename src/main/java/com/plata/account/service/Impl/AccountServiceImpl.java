package com.plata.account.service.Impl;

import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.entity.Account;
import com.plata.account.repository.AccountRepository;
import com.plata.account.service.AccountService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AccountServiceImpl implements AccountService {
    AccountRepository accountRepository;
    @Override
    public Account createAccount(CreateAccountRequestDto accountDto) {
        return accountRepository.save(Account.createAccount(accountDto));
    }
}
