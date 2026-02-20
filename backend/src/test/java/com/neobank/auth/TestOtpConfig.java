package com.neobank.auth;

import com.neobank.auth.otp.OtpService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestOtpConfig {

    @Bean
    public OtpService otpService() {
        return new OtpService(null, null) {

            @Override
            public void sendOtp(String phone) {
            }

            @Override
            public boolean verifyOtp(String phone, String otp) {
                return true;
            }
        };
    }
}