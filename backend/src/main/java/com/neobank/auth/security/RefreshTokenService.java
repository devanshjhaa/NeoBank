package com.neobank.auth.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final String REFRESH_PREFIX = "refresh:";
    private static final String BLACKLIST_PREFIX = "blacklist:";
    private static final Duration REFRESH_TTL = Duration.ofDays(7);

    private final StringRedisTemplate redis;

    public RefreshTokenService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public String createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString();
        redis.opsForValue().set(REFRESH_PREFIX + token, String.valueOf(userId), REFRESH_TTL);
        return token;
    }

    public Long validateAndGetUserId(String refreshToken) {
        String value = redis.opsForValue().get(REFRESH_PREFIX + refreshToken);
        if (value == null) return null;
        return Long.valueOf(value);
    }

    public void revokeRefreshToken(String refreshToken) {
        redis.delete(REFRESH_PREFIX + refreshToken);
    }

    public String rotateRefreshToken(String oldToken, Long userId) {
        revokeRefreshToken(oldToken);
        return createRefreshToken(userId);
    }

    public void blacklistAccessToken(String accessToken, long remainingTtlSeconds) {
        if (remainingTtlSeconds > 0) {
            redis.opsForValue().set(
                    BLACKLIST_PREFIX + accessToken,
                    "revoked",
                    Duration.ofSeconds(remainingTtlSeconds)
            );
        }
    }

    public boolean isAccessTokenBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(redis.hasKey(BLACKLIST_PREFIX + accessToken));
    }

    public void revokeAllUserTokens(Long userId) {
        // Scan and delete all refresh tokens for this user
        var keys = redis.keys(REFRESH_PREFIX + "*");
        if (keys != null) {
            for (String key : keys) {
                String val = redis.opsForValue().get(key);
                if (String.valueOf(userId).equals(val)) {
                    redis.delete(key);
                }
            }
        }
    }
}
