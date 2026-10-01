package com.plata.account.controller;

import com.plata.account.dto.*;
        import com.plata.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@AllArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/create")
    public AccountResponseDto createAccount(@AuthenticationPrincipal UUID customerId, @RequestBody @Valid CreateAccountRequestDto accountDto) {
        return accountService.createAccount(customerId, accountDto);
    }

    @GetMapping
    public List<AccountResponseDto> listAccounts(@AuthenticationPrincipal UUID customerId) {
        return accountService.listAccounts(customerId);
    }

    @PostMapping("/{accountId}/deposit")
    public DepositMoneyResponseDto depositMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID accountId,@RequestBody @Valid DepositMoneyRequestDto depositMoneyRequestDto){
        return accountService.depositMoney(customerId, accountId,depositMoneyRequestDto);
    }

    @PostMapping("/{accountId}/withdraw")
    public WithdrawMoneyResponseDto withdrawMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID accountId,@RequestBody @Valid WithdrawMoneyRequestDto withdrawMoneyRequestDto){
        return accountService.withdrawMoney(customerId, accountId, withdrawMoneyRequestDto);
    }

    @PostMapping("/{sourceAccountId}/transfer")
    public TransferMoneyResponseDto transferMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID sourceAccountId, @RequestBody TransferMoneyRequestDto transferMoneyRequestDto){
        return accountService.transferMoney(customerId,sourceAccountId,transferMoneyRequestDto);
    }
}
