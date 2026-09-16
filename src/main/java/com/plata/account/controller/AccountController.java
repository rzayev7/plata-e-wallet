package com.plata.account.controller;

import com.plata.account.dto.CreateAccountRequestDto;
import com.plata.account.entity.Account;
import com.plata.account.service.AccountService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/account")
@AllArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/create")
    public Account createAccount(@RequestBody CreateAccountRequestDto accountDto) {
        return accountService.createAccount(accountDto);
    }
}
