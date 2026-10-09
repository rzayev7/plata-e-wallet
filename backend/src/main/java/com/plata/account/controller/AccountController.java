package com.plata.account.controller;

import com.plata.account.dto.*;
        import com.plata.account.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@AllArgsConstructor
@Tag(
        name = "Accounts",
        description = "Account management and money operations"
)
public class AccountController {

    private final AccountService accountService;

    @Operation(
            summary = "Create a new account",
            description = "Creates a new bank account for the authenticated customer"
    )
    @PostMapping("/create")
    public AccountResponseDto createAccount(@AuthenticationPrincipal UUID customerId, @RequestBody @Valid CreateAccountRequestDto accountDto) {
        return accountService.createAccount(customerId, accountDto);
    }

    @Operation(
            summary = "List customer accounts",
            description = "Returns all accounts belonging to the authenticated customer"
    )
    @GetMapping
    public List<AccountResponseDto> listAccounts(@AuthenticationPrincipal UUID customerId) {
        return accountService.listAccounts(customerId);
    }
    @Operation(
            summary = "Deposit money",
            description = "Deposits money into the specified account"
    )
    @PostMapping("/{accountId}/deposit")
    public DepositMoneyResponseDto depositMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID accountId,@RequestBody @Valid DepositMoneyRequestDto depositMoneyRequestDto){
        return accountService.depositMoney(customerId, accountId,depositMoneyRequestDto);
    }
    @Operation(
            summary = "Withdraw money",
            description = "Withdraws money from the specified account"
    )
    @PostMapping("/{accountId}/withdraw")
    public WithdrawMoneyResponseDto withdrawMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID accountId,@RequestBody @Valid WithdrawMoneyRequestDto withdrawMoneyRequestDto){
        return accountService.withdrawMoney(customerId, accountId, withdrawMoneyRequestDto);
    }
    @Operation(
            summary = "Transfer money",
            description = "Transfers money from the customer's account to another account"
    )
    @PostMapping("/{sourceAccountId}/transfer")
    public TransferMoneyResponseDto transferMoney(@AuthenticationPrincipal UUID customerId, @PathVariable UUID sourceAccountId, @RequestBody @Valid TransferMoneyRequestDto transferMoneyRequestDto){
        return accountService.transferMoney(customerId,sourceAccountId,transferMoneyRequestDto);
    }
}
