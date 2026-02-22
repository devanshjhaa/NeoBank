package com.neobank.auth.dto;

public record AuthResponse(
        String accessToken,
        boolean newUser
) {
    public AuthResponse(String accessToken) {
        this(accessToken, false);
    }
}
