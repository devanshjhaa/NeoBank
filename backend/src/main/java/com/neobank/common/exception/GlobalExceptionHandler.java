package com.neobank.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unexpected error traceId={}", traceId, ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", Map.of(
                        "code", "INTERNAL_ERROR",
                        "message", "Something went wrong",
                        "traceId", traceId)));
    }
}
