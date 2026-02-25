package com.neobank.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        boolean newUser
) {
    public AuthResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, false);
    }
}
