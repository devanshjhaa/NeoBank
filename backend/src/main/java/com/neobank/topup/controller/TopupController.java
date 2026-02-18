package com.neobank.topup.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.topup.dto.TopupConfirmRequest;
import com.neobank.topup.dto.TopupResponse;
import com.neobank.topup.entity.Topup;
import com.neobank.topup.service.TopupService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/topup")
public class TopupController {

    private final TopupService topupService;

    public TopupController(TopupService topupService) {
        this.topupService = topupService;
    }

    @PostMapping("/confirm")
    public TopupResponse confirm(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody TopupConfirmRequest req) {
        Topup topup = topupService.confirmTopup(
                principal.getUserId(),
                req.amount(),
                req.idempotencyKey(),
                req.gatewayRef());

        return new TopupResponse(
                topup.getId(),
                topup.getAmount(),
                topup.getStatus(),
                topup.getGatewayRef(),
                topup.getCreatedAt());
    }
}
