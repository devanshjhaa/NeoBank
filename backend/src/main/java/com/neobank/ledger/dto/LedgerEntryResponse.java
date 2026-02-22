package com.neobank.ledger.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LedgerEntryResponse(
        Long id,
        BigDecimal amount,
        String direction,
        String txnType,
        String referenceId,
        String description,
        Instant createdAt
) {}
