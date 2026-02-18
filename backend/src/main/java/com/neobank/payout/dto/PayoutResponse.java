package com.neobank.payout.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PayoutResponse(
        Long payoutId,
        BigDecimal amount,
        String status,
        Instant createdAt) {
}
