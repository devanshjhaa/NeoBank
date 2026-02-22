package com.neobank.bankaccount.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LinkBankAccountRequest(
        @NotBlank(message = "Account number is required")
        @Pattern(regexp = "^[0-9]{9,18}$", message = "Account number must be 9-18 digits")
        String accountNumber,

        @NotBlank(message = "IFSC code is required")
        @Pattern(regexp = "^[A-Za-z]{4}0[A-Za-z0-9]{6}$", message = "Invalid IFSC code format")
        String ifscCode,

        @NotBlank(message = "Account holder name is required")
        String holderName) {
}
