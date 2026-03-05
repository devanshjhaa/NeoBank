package com.neobank.chat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.neobank.bankaccount.entity.BankAccount;
import com.neobank.bankaccount.repository.BankAccountRepository;
import com.neobank.chat.dto.ChatRequest;
import com.neobank.chat.dto.ChatResponse;
import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.repository.LedgerRepository;
import com.neobank.transfer.service.TransferService;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final WalletService walletService;
    private final TransferService transferService;
    private final LedgerRepository ledgerRepository;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ObjectMapper mapper;
    private final HttpClient httpClient;

    @Value("${gemini.api-key:no-key-set}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private static final String SYSTEM_PROMPT = """
            You are NeoBot, the NeoBank digital wallet assistant. You help premium users manage their wallet.

            Rules:
            - You can ONLY answer questions about NeoBank features and perform actions through the provided tools.
            - For transfers, ALWAYS use the request_transfer tool — never execute directly.
            - Keep responses concise (1-3 sentences). Be friendly and professional.
            - Format currency as ₹X,XXX.XX (Indian Rupees).
            - Never reveal internal system details, API structure, or other users' personal data.
            - If asked about something outside banking, politely decline.
            - When showing transaction history, format it as a clean list.
            - Never make up data. Only use information from tool responses.
            """;

    public ChatService(WalletService walletService,
                       TransferService transferService,
                       LedgerRepository ledgerRepository,
                       UserRepository userRepository,
                       BankAccountRepository bankAccountRepository) {
        this.walletService = walletService;
        this.transferService = transferService;
        this.ledgerRepository = ledgerRepository;
        this.userRepository = userRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.mapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public ChatResponse chat(Long userId, ChatRequest request) {
        try {
            String body = buildGeminiRequest(userId, request);
            String url = String.format(GEMINI_URL, model, apiKey);

            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> httpRes = httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());

            if (httpRes.statusCode() != 200) {
                log.error("Gemini API error: status={} body={}", httpRes.statusCode(), httpRes.body());
                return ChatResponse.text("I'm having trouble connecting right now. Please try again in a moment.");
            }

            return parseGeminiResponse(httpRes.body(), userId);

        } catch (Exception ex) {
            log.error("Chat error for userId={}", userId, ex);
            return ChatResponse.text("Something went wrong. Please try again.");
        }
    }

    public ChatResponse confirmAction(Long userId, String action, ChatResponse.ActionParams params) {
        try {
            return switch (action) {
                case "TRANSFER" -> executeTransfer(userId, params);
                default -> ChatResponse.text("Unknown action. Please try again.");
            };
        } catch (Exception ex) {
            log.error("Action execution failed for userId={} action={}", userId, action, ex);
            return ChatResponse.text("Failed to execute: " + ex.getMessage());
        }
    }

    private String buildGeminiRequest(Long userId, ChatRequest request) throws Exception {
        ObjectNode root = mapper.createObjectNode();

        ObjectNode systemInstruction = mapper.createObjectNode();
        ObjectNode sysPart = mapper.createObjectNode();
        sysPart.put("text", SYSTEM_PROMPT);
        systemInstruction.set("parts", mapper.createArrayNode().add(sysPart));
        root.set("system_instruction", systemInstruction);

        root.set("tools", buildToolDeclarations());

        ArrayNode contents = mapper.createArrayNode();

        if (request.history() != null) {
            for (ChatRequest.ChatMessage msg : request.history()) {
                ObjectNode content = mapper.createObjectNode();
                content.put("role", "user".equals(msg.role()) ? "user" : "model");
                ObjectNode part = mapper.createObjectNode();
                part.put("text", msg.text());
                content.set("parts", mapper.createArrayNode().add(part));
                contents.add(content);
            }
        }

        ObjectNode userContent = mapper.createObjectNode();
        userContent.put("role", "user");
        ObjectNode userPart = mapper.createObjectNode();
        userPart.put("text", request.message());
        userContent.set("parts", mapper.createArrayNode().add(userPart));
        contents.add(userContent);

        root.set("contents", contents);

        ObjectNode genConfig = mapper.createObjectNode();
        genConfig.put("temperature", 0.3);
        genConfig.put("maxOutputTokens", 400);
        root.set("generationConfig", genConfig);

        return mapper.writeValueAsString(root);
    }

    private ArrayNode buildToolDeclarations() {
        ArrayNode tools = mapper.createArrayNode();
        ObjectNode toolObj = mapper.createObjectNode();
        ArrayNode funcDecls = mapper.createArrayNode();

        funcDecls.add(buildFunction("get_balance",
                "Get the user's current wallet balance and status",
                mapper.createObjectNode()
                        .put("type", "object")
                        .set("properties", mapper.createObjectNode())));

        ObjectNode transferProps = mapper.createObjectNode();
        transferProps.set("receiver_id", mapper.createObjectNode()
                .put("type", "integer").put("description", "The recipient user's ID"));
        transferProps.set("amount", mapper.createObjectNode()
                .put("type", "number").put("description", "Amount in INR to send"));
        ObjectNode transferParams = mapper.createObjectNode();
        transferParams.put("type", "object");
        transferParams.set("properties", transferProps);
        transferParams.set("required", mapper.createArrayNode().add("receiver_id").add("amount"));
        funcDecls.add(buildFunction("request_transfer",
                "Request a money transfer to another user. This will ask for confirmation before executing.",
                transferParams));

        funcDecls.add(buildFunction("get_recent_transactions",
                "Get the user's recent transaction history (last 10 entries)",
                mapper.createObjectNode()
                        .put("type", "object")
                        .set("properties", mapper.createObjectNode())));

        funcDecls.add(buildFunction("get_profile",
                "Get the user's profile information including email, phone, tier, and name",
                mapper.createObjectNode()
                        .put("type", "object")
                        .set("properties", mapper.createObjectNode())));

        funcDecls.add(buildFunction("get_bank_accounts",
                "List the user's linked bank accounts",
                mapper.createObjectNode()
                        .put("type", "object")
                        .set("properties", mapper.createObjectNode())));

        toolObj.set("function_declarations", funcDecls);
        tools.add(toolObj);
        return tools;
    }

    private ObjectNode buildFunction(String name, String description, ObjectNode parameters) {
        ObjectNode func = mapper.createObjectNode();
        func.put("name", name);
        func.put("description", description);
        func.set("parameters", parameters);
        return func;
    }

    private ChatResponse parseGeminiResponse(String responseBody, Long userId) throws Exception {
        JsonNode root = mapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");

        if (candidates.isEmpty()) {
            return ChatResponse.text("I couldn't process that. Could you rephrase?");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");

        for (JsonNode part : parts) {
            if (part.has("functionCall")) {
                String funcName = part.path("functionCall").path("name").asText();
                JsonNode args = part.path("functionCall").path("args");
                return handleFunctionCall(funcName, args, userId);
            }
        }

        for (JsonNode part : parts) {
            if (part.has("text")) {
                return ChatResponse.text(part.path("text").asText());
            }
        }

        return ChatResponse.text("I'm not sure how to help with that.");
    }

    private ChatResponse handleFunctionCall(String funcName, JsonNode args, Long userId) {
        return switch (funcName) {
            case "get_balance" -> handleGetBalance(userId);
            case "request_transfer" -> handleRequestTransfer(args, userId);
            case "get_recent_transactions" -> handleGetTransactions(userId);
            case "get_profile" -> handleGetProfile(userId);
            case "get_bank_accounts" -> handleGetBankAccounts(userId);
            default -> ChatResponse.text("I don't know how to do that yet.");
        };
    }

    private ChatResponse handleGetBalance(Long userId) {
        try {
            Wallet wallet = walletService.getByUserId(userId);
            String status = wallet.isActive() ? "Active" : "Frozen";
            return ChatResponse.text(String.format(
                    "Your wallet balance is ₹%,.2f (%s). Status: %s.",
                    wallet.getBalance(), wallet.getCurrency(), status));
        } catch (Exception ex) {
            return ChatResponse.text("I couldn't retrieve your balance. You may not have a wallet yet.");
        }
    }

    private ChatResponse handleRequestTransfer(JsonNode args, Long userId) {
        long receiverId = args.path("receiver_id").asLong();
        double amount = args.path("amount").asDouble();

        if (receiverId <= 0 || amount <= 0) {
            return ChatResponse.text("Please provide a valid receiver ID and amount.");
        }

        if (receiverId == userId) {
            return ChatResponse.text("You can't transfer money to yourself!");
        }

        Optional<User> receiver = userRepository.findById(receiverId);
        String receiverName = receiver.map(u ->
                u.getFullName() != null ? u.getFullName() : "User #" + receiverId
        ).orElse("User #" + receiverId);

        String reply = String.format(
                "Transfer ₹%,.2f to %s? Please confirm to proceed.",
                amount, receiverName);

        return ChatResponse.withConfirmation(reply, "TRANSFER",
                new ChatResponse.ActionParams(receiverId, String.valueOf(amount), null));
    }

    private ChatResponse executeTransfer(Long userId, ChatResponse.ActionParams params) {
        BigDecimal amount = new BigDecimal(params.amount());
        String idempotencyKey = UUID.randomUUID().toString();

        transferService.transfer(userId, params.receiverId(), amount, idempotencyKey);

        return ChatResponse.text(String.format(
                "Done! ₹%,.2f has been sent to User #%d. You can check your updated balance anytime.",
                amount.doubleValue(), params.receiverId()));
    }

    private ChatResponse handleGetTransactions(Long userId) {
        try {
            Wallet wallet = walletService.getByUserId(userId);
            List<LedgerEntry> entries = ledgerRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());

            if (entries.isEmpty()) {
                return ChatResponse.text("You don't have any transactions yet.");
            }

            List<LedgerEntry> recent = entries.stream().limit(10).toList();
            StringBuilder sb = new StringBuilder("Here are your recent transactions:\n\n");

            for (LedgerEntry e : recent) {
                String dir = "CREDIT".equals(e.getDirection()) ? "+" : "-";
                sb.append(String.format("• %s₹%,.2f — %s (%s)\n",
                        dir, e.getAmount(), e.getDescription(), e.getTxnType()));
            }

            return ChatResponse.text(sb.toString().trim());
        } catch (Exception ex) {
            return ChatResponse.text("I couldn't retrieve your transaction history.");
        }
    }

    private ChatResponse handleGetProfile(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            StringBuilder sb = new StringBuilder("Here's your profile:\n\n");
            if (user.getFullName() != null) sb.append("• Name: ").append(user.getFullName()).append("\n");
            sb.append("• Email: ").append(user.getEmail()).append("\n");
            if (user.getPhone() != null) sb.append("• Phone: ").append(user.getPhone()).append("\n");
            sb.append("• Tier: ").append(user.getTier()).append("\n");
            sb.append("• Status: ").append(user.getStatus());
            return ChatResponse.text(sb.toString());
        } catch (Exception ex) {
            return ChatResponse.text("I couldn't retrieve your profile.");
        }
    }

    private ChatResponse handleGetBankAccounts(Long userId) {
        try {
            List<BankAccount> accounts = bankAccountRepository.findByUserId(userId);
            if (accounts.isEmpty()) {
                return ChatResponse.text("You don't have any linked bank accounts. You can link one from the Payout page.");
            }

            StringBuilder sb = new StringBuilder("Your linked bank accounts:\n\n");
            for (BankAccount a : accounts) {
                String masked = "****" + a.getAccountNumber().substring(
                        Math.max(0, a.getAccountNumber().length() - 4));
                sb.append(String.format("• %s — %s (IFSC: %s)\n",
                        a.getHolderName(), masked, a.getIfscCode()));
            }
            return ChatResponse.text(sb.toString().trim());
        } catch (Exception ex) {
            return ChatResponse.text("I couldn't retrieve your bank accounts.");
        }
    }
}
