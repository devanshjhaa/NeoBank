package com.neobank.auth.service;

import com.neobank.auth.otp.OtpService;
import com.neobank.auth.security.JwtProvider;
import com.neobank.common.exception.ApiException;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final OtpService otpService;
    private final JwtProvider jwtProvider;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository,
            WalletService walletService,
            OtpService otpService,
            JwtProvider jwtProvider,
            GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.otpService = otpService;
        this.jwtProvider = jwtProvider;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    @Transactional
    public void signup(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw ApiException.conflict("EMAIL_EXISTS", "Email already registered");
        }

        User user = User.createWithEmail(email, encoder.encode(password));
        userRepository.save(user);

        log.info("User signed up email={}", email);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("INVALID_CREDENTIALS", "Invalid email or password"));

        if (user.getPasswordHash() == null || !encoder.matches(password, user.getPasswordHash())) {
            throw ApiException.badRequest("INVALID_CREDENTIALS", "Invalid email or password");
        }

        log.info("User login email={}", email);

        return jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
    }

    public void requestOtp(String email, String phone) {
        otpService.sendOtp(email, phone);
    }

    @Transactional
    public String verifyOtp(String email, String phone, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!otpService.verifyOtp(phone, otp)) {
            log.warn("OTP verification failed for email={}", email);
            throw ApiException.badRequest("INVALID_OTP", "Invalid or expired OTP");
        }

        userRepository.findByPhone(phone).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw ApiException.conflict("PHONE_TAKEN", "This phone number is already linked to another account");
            }
        });

        user.verifyPhone(phone);
        userRepository.save(user);

        walletService.createWalletIfAbsent(user.getId());

        log.info("User verified email={}", email);

        return jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
    }

    @Transactional
    public String loginWithGoogle(String idToken) {
        GoogleTokenVerifier.GoogleUser googleUser = googleTokenVerifier.verify(idToken);

        User user = userRepository.findByEmail(googleUser.email())
                .orElseGet(() -> {
                    User newUser = User.createWithGoogle(googleUser.email(), googleUser.sub());
                    userRepository.save(newUser);
                    walletService.createWalletIfAbsent(newUser.getId());
                    log.info("New Google user created email={}", googleUser.email());
                    return newUser;
                });

        if (!user.isActive()) {
            throw ApiException.forbidden("Account is suspended");
        }

        log.info("Google login email={}", googleUser.email());

        return jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
    }
}
