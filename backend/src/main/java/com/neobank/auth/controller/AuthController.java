package com.neobank.auth.controller;

import com.neobank.auth.dto.*;
import com.neobank.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public void signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req.email(), req.password());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        AuthService.TokenPair pair = authService.login(req.email(), req.password());
        return new AuthResponse(pair.accessToken(), pair.refreshToken());
    }

    @PostMapping("/request-otp")
    public void requestOtp(@Valid @RequestBody RequestOtpRequest req) {
        authService.requestOtp(req.email(), req.phone());
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        AuthService.TokenPair pair = authService.verifyOtp(req.email(), req.phone(), req.otp());
        return new AuthResponse(pair.accessToken(), pair.refreshToken());
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody GoogleAuthRequest req) {
        AuthService.GoogleLoginResult result = authService.loginWithGoogle(req.idToken());
        return new AuthResponse(result.accessToken(), result.refreshToken(), result.newUser());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        AuthService.TokenPair pair = authService.refresh(req.refreshToken());
        return new AuthResponse(pair.accessToken(), pair.refreshToken());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest req, HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String accessToken = null;
        if (header != null && header.startsWith("Bearer ")) {
            accessToken = header.substring(7);
        }
        authService.logout(accessToken, req.refreshToken());
    }
}
