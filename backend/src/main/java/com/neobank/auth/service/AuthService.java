package com.neobank.auth.service;

import com.neobank.auth.otp.OtpService;
import com.neobank.auth.security.JwtProvider;
import com.neobank.auth.security.RefreshTokenService;
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
    private final RefreshTokenService refreshTokenService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository,
            WalletService walletService,
            OtpService otpService,
            JwtProvider jwtProvider,
            GoogleTokenVerifier googleTokenVerifier,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.otpService = otpService;
        this.jwtProvider = jwtProvider;
        this.googleTokenVerifier = googleTokenVerifier;
        this.refreshTokenService = refreshTokenService;
    }

    public record TokenPair(String accessToken, String refreshToken) {}

    @Transactional
    public void signup(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw ApiException.conflict("EMAIL_EXISTS", "Email already registered");
        }

        User user = User.createWithEmail(email, encoder.encode(password));
        userRepository.save(user);

        log.info("User signed up email={}", email);
    }

    public TokenPair login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("INVALID_CREDENTIALS", "Invalid email or password"));

        if (user.getPasswordHash() == null || !encoder.matches(password, user.getPasswordHash())) {
            throw ApiException.badRequest("INVALID_CREDENTIALS", "Invalid email or password");
        }

        if (!user.isActive()) {
            throw ApiException.forbidden("Account is suspended");
        }

        log.info("User login email={}", email);

        String accessToken = jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new TokenPair(accessToken, refreshToken);
    }

    public void requestOtp(String email, String phone) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        userRepository.findByPhone(phone).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw ApiException.conflict("PHONE_TAKEN", "This phone number is already linked to another account");
            }
        });

        otpService.sendOtp(email, phone);
    }

    @Transactional
    public TokenPair verifyOtp(String email, String phone, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!otpService.verifyOtp(phone, otp)) {
            log.warn("OTP verification failed for email={}", email);
            throw ApiException.badRequest("INVALID_OTP", "Invalid or expired OTP");
        }

        user.verifyPhone(phone);
        userRepository.save(user);

        walletService.createWalletIfAbsent(user.getId());

        log.info("User verified email={}", email);

        String accessToken = jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new TokenPair(accessToken, refreshToken);
    }

    public record GoogleLoginResult(String accessToken, String refreshToken, boolean newUser) {}

    @Transactional
    public GoogleLoginResult loginWithGoogle(String idToken) {
        GoogleTokenVerifier.GoogleUser googleUser = googleTokenVerifier.verify(idToken);

        boolean[] isNew = { false };
        User user = userRepository.findByEmail(googleUser.email())
                .orElseGet(() -> {
                    User newUser = User.createWithGoogle(googleUser.email(), googleUser.sub());
                    userRepository.save(newUser);
                    walletService.createWalletIfAbsent(newUser.getId());
                    isNew[0] = true;
                    log.info("New Google user created email={}", googleUser.email());
                    return newUser;
                });

        if (!user.isActive()) {
            throw ApiException.forbidden("Account is suspended");
        }

        boolean needsPhoneVerification = isNew[0] || !user.isPhoneVerified();

        log.info("Google login email={} newUser={}", googleUser.email(), needsPhoneVerification);

        String accessToken = jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new GoogleLoginResult(accessToken, refreshToken, needsPhoneVerification);
    }

    public TokenPair refresh(String refreshToken) {
        Long userId = refreshTokenService.validateAndGetUserId(refreshToken);
        if (userId == null) {
            throw ApiException.unauthorized("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("USER_NOT_FOUND", "User not found"));

        if (!user.isActive()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
            throw ApiException.forbidden("Account is suspended");
        }

        String newAccessToken = jwtProvider.createToken(user.getId(), user.getEmail(), user.getTier());
        String newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken, userId);

        return new TokenPair(newAccessToken, newRefreshToken);
    }

    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && jwtProvider.isValid(accessToken)) {
            long remainingTtl = jwtProvider.getRemainingTtlSeconds(accessToken);
            refreshTokenService.blacklistAccessToken(accessToken, remainingTtl);
        }
        if (refreshToken != null) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
    }
}
