package com.neobank.user.dto;

import java.time.Instant;

public record UserProfileResponse(
        Long id,
        String email,
        String phone,
        boolean phoneVerified,
        String status,
        String tier,
        String authProvider,
        Instant createdAt
) {}
