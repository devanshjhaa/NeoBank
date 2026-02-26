package com.neobank.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyOtpRequest(
                @NotBlank String email,
                @NotBlank String phone,
                @NotBlank String otp,
                String fullName,
                String dateOfBirth) {
}
