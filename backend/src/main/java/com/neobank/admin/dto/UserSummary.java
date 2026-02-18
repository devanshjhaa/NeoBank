package com.neobank.admin.dto;

import java.time.Instant;

public record UserSummary(
        Long id,
        String email,
        String phone,
        boolean phoneVerified,
        String status,
        String tier,
        Instant createdAt) {
}
