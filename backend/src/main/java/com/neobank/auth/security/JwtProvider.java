package com.neobank.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTtlSeconds;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-ttl-seconds}") long accessTtlSeconds
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTtlSeconds = accessTtlSeconds;
    }

    public String createToken(Long userId, String email, String tier) {

        Instant now = Instant.now();

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claims(Map.of(
                        "email", email,
                        "tier", tier
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }

    public String getEmail(String token) {
        return parse(token).get("email", String.class);
    }

    public String getTier(String token) {
        return parse(token).get("tier", String.class);
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public long getRemainingTtlSeconds(String token) {
        try {
            Claims claims = parse(token);
            long expiryEpoch = claims.getExpiration().getTime() / 1000;
            long now = java.time.Instant.now().getEpochSecond();
            return Math.max(0, expiryEpoch - now);
        } catch (Exception ex) {
            return 0;
        }
    }
}
