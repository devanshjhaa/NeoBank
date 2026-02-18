package com.neobank.transfer.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.transfer.dto.TransferRequest;
import com.neobank.transfer.entity.Transaction;
import com.neobank.transfer.service.TransferService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transfer")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public Transaction transfer(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody TransferRequest req
    ) {

        return transferService.transfer(
                principal.getUserId(),  // sender
                req.receiverId(),
                req.amount(),
                req.idempotencyKey()
        );
    }
}
