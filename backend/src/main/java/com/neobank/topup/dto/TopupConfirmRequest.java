package com.neobank.topup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TopupConfirmRequest(
                @NotNull @Positive BigDecimal amount,
                @NotBlank String idempotencyKey,
                @NotBlank String gatewayRef) {
}
