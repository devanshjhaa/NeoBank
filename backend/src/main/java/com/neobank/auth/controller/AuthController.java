package com.neobank.auth.controller;

import com.neobank.auth.dto.*;
import com.neobank.auth.service.AuthService;
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
        String token = authService.login(req.email(), req.password());
        return new AuthResponse(token);
    }

    @PostMapping("/request-otp")
    public void requestOtp(@Valid @RequestBody RequestOtpRequest req) {
        authService.requestOtp(req.email(), req.phone());
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        String token = authService.verifyOtp(req.email(), req.phone(), req.otp());
        return new AuthResponse(token);
    }
}
