package com.neobank.common.redis;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class RedisLockService {

    private final StringRedisTemplate redis;

    private static final DefaultRedisScript<Long> RELEASE_SCRIPT;

    static {
        RELEASE_SCRIPT = new DefaultRedisScript<>();
        RELEASE_SCRIPT.setScriptText(
                "if redis.call('get',KEYS[1]) == ARGV[1] then " +
                        "return redis.call('del',KEYS[1]) else return 0 end");
        RELEASE_SCRIPT.setResultType(Long.class);
    }

    public RedisLockService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public String acquire(String key, Duration ttl) {
        String ownerId = UUID.randomUUID().toString();
        Boolean success = redis.opsForValue().setIfAbsent(key, ownerId, ttl);
        return Boolean.TRUE.equals(success) ? ownerId : null;
    }

    public void release(String key, String ownerId) {
        redis.execute(RELEASE_SCRIPT, List.of(key), ownerId);
    }
}
