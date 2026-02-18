package com.neobank.auth.otp;

import com.neobank.auth.sms.SmsGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;

    private final StringRedisTemplate redis;
    private final SmsGateway smsGateway;
    private final SecureRandom random = new SecureRandom();

    public OtpService(StringRedisTemplate redis,
            SmsGateway smsGateway) {
        this.redis = redis;
        this.smsGateway = smsGateway;
    }

    public void sendOtp(String phone) {
        String otp = generateOtp();

        redis.opsForValue().set(otpKey(phone), otp, OTP_TTL);
        redis.opsForValue().set(attemptsKey(phone), "0", OTP_TTL);

        smsGateway.sendOtp(phone, otp);

        log.info("OTP sent to phone={}", mask(phone));
    }

    public boolean verifyOtp(String phone, String providedOtp) {
        String storedOtp = redis.opsForValue().get(otpKey(phone));

        if (storedOtp == null) {
            log.warn("OTP expired for phone={}", mask(phone));
            return false;
        }

        int attempts = incrementAttempts(attemptsKey(phone));

        if (attempts > MAX_ATTEMPTS) {
            redis.delete(otpKey(phone));
            redis.delete(attemptsKey(phone));
            log.warn("OTP attempts exceeded for phone={}", mask(phone));
            return false;
        }

        if (!storedOtp.equals(providedOtp)) {
            log.warn("Invalid OTP for phone={}", mask(phone));
            return false;
        }

        redis.delete(otpKey(phone));
        redis.delete(attemptsKey(phone));
        return true;
    }

    private String generateOtp() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    private int incrementAttempts(String key) {
        Long val = redis.opsForValue().increment(key);
        return val == null ? 1 : val.intValue();
    }

    private String otpKey(String phone) {
        return "otp:" + phone;
    }

    private String attemptsKey(String phone) {
        return "otp:attempts:" + phone;
    }

    private String mask(String phone) {
        if (phone == null || phone.length() < 4)
            return "****";
        return "******" + phone.substring(phone.length() - 4);
    }
}
