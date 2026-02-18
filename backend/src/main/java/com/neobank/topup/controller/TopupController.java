package com.neobank.topup.controller;

import com.neobank.topup.dto.TopupConfirmRequest;
import com.neobank.topup.entity.Topup;
import com.neobank.topup.service.TopupService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/topup")
public class TopupController {

    private final TopupService topupService;

    public TopupController(TopupService topupService) {
        this.topupService = topupService;
    }

    @PostMapping("/confirm")
    public Topup confirm(@RequestBody TopupConfirmRequest req) {

        return topupService.confirmTopup(
                req.userId(),
                req.amount(),
                req.idempotencyKey(),
                req.gatewayRef()
        );
    }
}
