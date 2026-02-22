package com.neobank.bankaccount.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.bankaccount.dto.BankAccountResponse;
import com.neobank.bankaccount.dto.LinkBankAccountRequest;
import com.neobank.bankaccount.entity.BankAccount;
import com.neobank.bankaccount.service.BankAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bank-accounts")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BankAccountResponse linkAccount(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody LinkBankAccountRequest req) {
        BankAccount account = bankAccountService.linkAccount(
                principal.getUserId(),
                req.accountNumber(),
                req.ifscCode(),
                req.holderName());
        return toResponse(account);
    }

    @GetMapping
    public List<BankAccountResponse> getAccounts(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return bankAccountService.getUserAccounts(principal.getUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable Long id) {
        bankAccountService.deleteAccount(principal.getUserId(), id);
    }

    private BankAccountResponse toResponse(BankAccount account) {
        return new BankAccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.maskedAccountNumber(),
                account.getIfscCode(),
                account.getHolderName(),
                account.isVerified(),
                account.getCreatedAt());
    }
}
