package com.neobank.chat.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.chat.dto.ChatConfirmRequest;
import com.neobank.chat.dto.ChatRequest;
import com.neobank.chat.dto.ChatResponse;
import com.neobank.chat.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
@PreAuthorize("hasRole('PREMIUM') or hasRole('ADMIN')")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ChatRequest request) {
        return chatService.chat(principal.getUserId(), request);
    }

    @PostMapping("/confirm")
    public ChatResponse confirm(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ChatConfirmRequest request) {
        return chatService.confirmAction(
                principal.getUserId(), request.action(), request.params());
    }
}
