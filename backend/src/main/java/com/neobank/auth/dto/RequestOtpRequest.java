package com.neobank.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestOtpRequest(
                @NotBlank String phone) {
}
