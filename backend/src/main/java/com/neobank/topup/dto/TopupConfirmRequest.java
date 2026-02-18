package com.neobank.topup.dto;

import java.math.BigDecimal;

public record TopupConfirmRequest(
        Long userId,
        BigDecimal amount,
        String idempotencyKey,
        String gatewayRef
) {}
