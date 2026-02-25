package com.neobank.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
        log.warn("API error: code={} message={}", ex.getCode(), ex.getMessage());

        return ResponseEntity.status(ex.getStatus()).body(Map.of(
                "error", Map.of(
                        "code", ex.getCode(),
                        "message", ex.getMessage(),
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {

        String field = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");

        return ResponseEntity.badRequest().body(Map.of(
                "error", Map.of(
                        "code", "VALIDATION_ERROR",
                        "message", field,
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", Map.of(
                        "code", "FORBIDDEN",
                        "message", "You do not have permission to perform this action",
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());

        return ResponseEntity.badRequest().body(Map.of(
                "error", Map.of(
                        "code", "BAD_REQUEST",
                        "message", ex.getMessage() != null ? ex.getMessage() : "Invalid request",
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        log.warn("Conflict: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", Map.of(
                        "code", "CONFLICT",
                        "message", ex.getMessage() != null ? ex.getMessage() : "Operation not allowed in current state",
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", Map.of(
                        "code", "NOT_FOUND",
                        "message", "The requested resource was not found",
                        "traceId", UUID.randomUUID().toString())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unexpected error traceId={}", traceId, ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", Map.of(
                        "code", "INTERNAL_ERROR",
                        "message", "An unexpected error occurred. Please try again later.",
                        "traceId", traceId)));
    }
}
