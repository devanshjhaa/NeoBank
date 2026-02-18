package com.neobank.auth.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class Fast2SmsGateway implements SmsGateway {

    private static final Logger log =
            LoggerFactory.getLogger(Fast2SmsGateway.class);

    private final RestClient restClient;

    @Value("${sms.fast2sms.api-key}")
    private String apiKey;

    @Value("${sms.fast2sms.sender-id}")
    private String senderId;

    @Value("${sms.fast2sms.route}")
    private String route;

    public Fast2SmsGateway() {
        this.restClient = RestClient.create("https://www.fast2sms.com");
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {

        String masked = mask(phoneNumber);

        log.info("Sending OTP SMS to phone={}", masked);

        try {
            restClient.post()
                    .uri("/dev/bulkV2")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("authorization", apiKey)
                    .body("variables_values=" + otp +
                          "&route=" + route +
                          "&numbers=" + phoneNumber +
                          "&sender_id=" + senderId)
                    .retrieve()
                    .toBodilessEntity();

            log.info("OTP SMS sent successfully to phone={}", masked);

        } catch (Exception ex) {
            log.error("Failed to send OTP SMS to phone={}", masked, ex);
            throw ex;
        }
    }

    private String mask(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "******" + phone.substring(phone.length() - 4);
    }
}
