package com.neobank.auth.controller;

import com.neobank.auth.dto.AuthResponse;
import com.neobank.auth.dto.RequestOtpRequest;
import com.neobank.auth.dto.VerifyOtpRequest;
import com.neobank.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/request-otp")
    public void requestOtp(@RequestBody RequestOtpRequest req) {
        authService.requestOtp(req.phone());
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody VerifyOtpRequest req) {

        String token = authService.verifyOtp(
                req.email(),
                req.phone(),
                req.otp()
        );

        return new AuthResponse(token);
    }
}
