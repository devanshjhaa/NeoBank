package com.neobank.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletSummary(
        Long id,
        Long userId,
        BigDecimal balance,
        String currency,
        String status,
        Instant createdAt) {
}
