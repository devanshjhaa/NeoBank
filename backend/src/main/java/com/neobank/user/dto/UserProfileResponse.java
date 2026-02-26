package com.neobank.user.dto;

import java.time.Instant;
import java.time.LocalDate;

public record UserProfileResponse(
        Long id,
        String email,
        String phone,
        boolean phoneVerified,
        String status,
        String tier,
        String authProvider,
        String fullName,
        LocalDate dateOfBirth,
        String avatarEmoji,
        Instant createdAt
) {}
