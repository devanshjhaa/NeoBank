package com.neobank.topup.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record TopupResponse(
        Long topupId,
        BigDecimal amount,
        String status,
        String gatewayRef,
        Instant createdAt) {
}
