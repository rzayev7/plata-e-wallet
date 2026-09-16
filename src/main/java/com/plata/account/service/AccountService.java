package com.plata.account.service;

import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.entity.Account;

public interface AccountService {
    Account createAccount(CreateAccountRequestDto accountDto);
}
