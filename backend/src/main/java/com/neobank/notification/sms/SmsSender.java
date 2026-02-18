package com.neobank.notification.sms;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

@Component
public class SmsSender {

    private final RestClient restClient = RestClient.create("https://www.fast2sms.com");

    public void send(String phone, String message) {

        restClient.post()
                .uri("/dev/bulkV2")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("message=" + message + "&numbers=" + phone)
                .retrieve()
                .toBodilessEntity();
    }
}
