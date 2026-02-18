package com.neobank.notification.sms;

import com.neobank.auth.sms.SmsGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SmsSender {

    private static final Logger log = LoggerFactory.getLogger(SmsSender.class);

    private final SmsGateway smsGateway;

    public SmsSender(SmsGateway smsGateway) {
        this.smsGateway = smsGateway;
    }

    public void send(String phone, String message) {
        if (phone == null || phone.isBlank()) {
            log.warn("Skipping SMS — no phone number");
            return;
        }

        try {
            smsGateway.sendOtp(phone, message);
        } catch (Exception ex) {
            log.error("SMS send failed phone={}", phone, ex);
        }
    }
}
