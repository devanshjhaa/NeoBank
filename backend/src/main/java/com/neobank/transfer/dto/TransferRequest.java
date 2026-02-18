package com.neobank.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TransferRequest(
                @NotNull Long receiverId,
                @NotNull @Positive BigDecimal amount,
                @NotBlank String idempotencyKey) {
}
