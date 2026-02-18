package com.neobank.payout.dto;

import java.math.BigDecimal;

public record PayoutRequest(
        Long bankAccountId,
        BigDecimal amount,
        String idempotencyKey
) {}
