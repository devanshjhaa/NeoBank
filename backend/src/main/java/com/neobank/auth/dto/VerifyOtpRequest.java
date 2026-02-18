package com.neobank.auth.dto;

public record VerifyOtpRequest(
        String email,
        String phone,
        String otp
) {}
