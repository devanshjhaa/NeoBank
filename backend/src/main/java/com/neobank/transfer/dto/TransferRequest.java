package com.neobank.transfer.dto;

import java.math.BigDecimal;

public record TransferRequest(
        Long receiverId,
        BigDecimal amount,
        String idempotencyKey
) {}
