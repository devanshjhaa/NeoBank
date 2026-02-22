package com.neobank.auth.otp;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.time.Duration;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;
    private static final String FROM_EMAIL = "neobank@ticksmanage.email";
    private static final String FROM_NAME = "NeoBank";

    private final StringRedisTemplate redis;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    public OtpService(StringRedisTemplate redis, JavaMailSender mailSender) {
        this.redis = redis;
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String phone) {
        String otp = generateOtp();

        redis.opsForValue().set(otpKey(phone), otp, OTP_TTL);
        redis.opsForValue().set(attemptsKey(phone), "0", OTP_TTL);

        try {
            sendOtpEmail(email, otp);
            log.info("OTP email sent to {}", maskEmail(email));
        } catch (Exception e) {
            log.warn("Email delivery failed for {}, OTP still stored in Redis", maskEmail(email), e);
        }
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

    private void sendOtpEmail(String to, String otp) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(FROM_EMAIL, FROM_NAME);
        helper.setTo(to);
        helper.setSubject("Your NeoBank verification code: " + otp);
        helper.setText(buildHtml(otp), true);
        mailSender.send(message);
    }

    private String buildHtml(String otp) {
        return """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background: #2563eb; color: #fff; font-weight: 700; font-size: 18px; padding: 10px 20px; border-radius: 10px; letter-spacing: 1px;">NeoBank</div>
                  </div>
                  <div style="background: #fff; border-radius: 10px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                    <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 20px;">Verification Code</h2>
                    <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Use the code below to verify your phone number and activate your wallet.</p>
                    <div style="text-align: center; margin: 24px 0;">
                      <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 16px 32px; border-radius: 10px; border: 2px dashed #bfdbfe;">%s</span>
                    </div>
                    <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
                  </div>
                  <p style="margin: 20px 0 0; color: #cbd5e1; font-size: 12px; text-align: center;">NeoBank &mdash; Your digital wallet</p>
                </div>
                """.formatted(otp);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****";
        String[] parts = email.split("@");
        String local = parts[0];
        if (local.length() <= 2) return local.charAt(0) + "***@" + parts[1];
        return local.substring(0, 2) + "***@" + parts[1];
    }

    private String mask(String phone) {
        if (phone == null || phone.length() < 4)
            return "****";
        return "******" + phone.substring(phone.length() - 4);
    }
}
