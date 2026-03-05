package com.neobank.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatConfirmRequest(
        @NotBlank String action,
        ChatResponse.ActionParams params
) {}
