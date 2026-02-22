package com.neobank.bankaccount.dto;

import java.time.Instant;

public record BankAccountResponse(
        Long id,
        String accountNumber,
        String maskedAccountNumber,
        String ifscCode,
        String holderName,
        boolean verified,
        Instant createdAt) {
}
