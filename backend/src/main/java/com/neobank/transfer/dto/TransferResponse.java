package com.neobank.transfer.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record TransferResponse(
        Long transactionId,
        Long senderId,
        Long receiverId,
        BigDecimal amount,
        String status,
        Instant createdAt) {
}
