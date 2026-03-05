package com.neobank.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotBlank @Size(max = 500) String message,
        List<ChatMessage> history
) {
    public record ChatMessage(String role, String text) {}
}
