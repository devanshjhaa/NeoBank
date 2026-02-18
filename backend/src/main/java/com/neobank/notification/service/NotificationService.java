package com.neobank.notification.service;

import com.neobank.notification.email.EmailSender;
import com.neobank.notification.sms.SmsSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final EmailSender emailSender;
    private final SmsSender smsSender;

    public NotificationService(EmailSender emailSender,
                               SmsSender smsSender) {
        this.emailSender = emailSender;
        this.smsSender = smsSender;
    }

    public void topupSuccess(String email, String phone, String amount) {
        emailSender.send(email, "Top-up successful", "Your wallet was credited: ₹" + amount);
        smsSender.send(phone, "Wallet credited ₹" + amount);
    }

    public void transferSent(String email, String amount) {
        emailSender.send(email, "Transfer sent", "You sent ₹" + amount);
    }

    public void transferReceived(String email, String amount) {
        emailSender.send(email, "Transfer received", "You received ₹" + amount);
    }

    public void payoutRequested(String email, String amount) {
        emailSender.send(email, "Payout requested", "Withdrawal ₹" + amount + " initiated");
    }

    public void payoutSuccess(String email, String amount) {
        emailSender.send(email, "Payout success", "Withdrawal ₹" + amount + " completed");
    }

    public void payoutFailed(String email, String amount) {
        emailSender.send(email, "Payout failed", "Withdrawal ₹" + amount + " failed and refunded");
    }

    public void premiumActivated(String email) {
        emailSender.send(email, "Premium activated", "Your premium plan is active");
    }
}
