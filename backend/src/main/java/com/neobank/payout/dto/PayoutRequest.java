package com.neobank.payout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PayoutRequest(
                @NotNull Long bankAccountId,
                @NotNull @Positive BigDecimal amount,
                @NotBlank String idempotencyKey) {
}
