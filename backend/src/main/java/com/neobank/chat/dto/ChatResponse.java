package com.neobank.chat.dto;

public record ChatResponse(
        String reply,
        String action,
        ActionParams actionParams,
        boolean requiresConfirmation
) {
    public record ActionParams(
            Long receiverId,
            String amount,
            Long bankAccountId
    ) {}

    public static ChatResponse text(String reply) {
        return new ChatResponse(reply, null, null, false);
    }

    public static ChatResponse withConfirmation(String reply, String action, ActionParams params) {
        return new ChatResponse(reply, action, params, true);
    }
}
