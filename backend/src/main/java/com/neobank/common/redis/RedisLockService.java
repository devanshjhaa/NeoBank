package com.neobank.common.redis;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RedisLockService {

    private final StringRedisTemplate redis;

    public RedisLockService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public boolean acquire(String key, Duration ttl) {
        return Boolean.TRUE.equals(
                redis.opsForValue().setIfAbsent(key, "1", ttl)
        );
    }

    public void release(String key) {
        redis.delete(key);
    }
}
