package com.neobank.auth.service;

import com.neobank.auth.otp.OtpService;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log =
            LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       WalletService walletService,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.otpService = otpService;
    }

    public void requestOtp(String phone) {
        otpService.sendOtp(phone);
    }

    @Transactional
    public void verifyOtp(String email, String phone, String otp) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean valid = otpService.verifyOtp(phone, otp);

        if (!valid) {
            log.warn("OTP verification failed for email={}", email);
            throw new RuntimeException("Invalid OTP");
        }

        user.verifyPhone(phone);
        userRepository.save(user);

        walletService.createWalletIfAbsent(user.getId());

        log.info("User phone verified and wallet created for email={}", email);
    }
}
