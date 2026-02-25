package com.neobank.transfer.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.transfer.dto.TransferRequest;
import com.neobank.transfer.dto.TransferResponse;
import com.neobank.transfer.entity.Transaction;
import com.neobank.transfer.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transfer")
@PreAuthorize("hasRole('USER')")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public TransferResponse transfer(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody TransferRequest req) {
        Transaction tx = transferService.transfer(
                principal.getUserId(),
                req.receiverId(),
                req.amount(),
                req.idempotencyKey());

        return new TransferResponse(
                tx.getId(),
                tx.getSenderId(),
                tx.getReceiverId(),
                tx.getAmount(),
                tx.getStatus(),
                tx.getCreatedAt());
    }
}
