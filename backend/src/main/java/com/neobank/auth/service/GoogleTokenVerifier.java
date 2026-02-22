package com.neobank.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neobank.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);
    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final String clientId;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GoogleTokenVerifier(@Value("${google.client-id}") String clientId) {
        this.clientId = clientId;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public GoogleUser verify(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKEN_INFO_URL + idToken))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Google token verification failed status={}", response.statusCode());
                throw ApiException.badRequest("INVALID_TOKEN", "Invalid Google ID token");
            }

            JsonNode body = objectMapper.readTree(response.body());

            String aud = body.path("aud").asText();
            if (!clientId.equals(aud)) {
                log.warn("Google token audience mismatch expected={} got={}", clientId, aud);
                throw ApiException.badRequest("INVALID_TOKEN", "Token audience mismatch");
            }

            String email = body.path("email").asText();
            String sub = body.path("sub").asText();
            boolean emailVerified = "true".equals(body.path("email_verified").asText());

            if (email.isEmpty() || sub.isEmpty()) {
                throw ApiException.badRequest("INVALID_TOKEN", "Token missing required fields");
            }

            if (!emailVerified) {
                throw ApiException.badRequest("EMAIL_NOT_VERIFIED", "Google account email is not verified");
            }

            return new GoogleUser(sub, email);

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification error", e);
            throw ApiException.badRequest("INVALID_TOKEN", "Failed to verify Google token");
        }
    }

    public record GoogleUser(String sub, String email) {}
}
