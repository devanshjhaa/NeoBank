package com.neobank.auth.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AuthPrincipal implements UserDetails {

    private final Long userId;
    private final String email;
    private final String tier;

    public AuthPrincipal(Long userId, String email, String tier) {
        this.userId = userId;
        this.email = email;
        this.tier = tier;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTier() {
        return tier;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // roles not used yet
    }

    @Override
    public String getPassword() {
        return null; // JWT auth
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
