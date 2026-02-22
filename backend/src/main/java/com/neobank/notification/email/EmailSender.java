package com.neobank.notification.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class EmailSender {

    private final JavaMailSender mailSender;

    public EmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void send(String to, String subject, String body) {

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom("NeoBank <neobank@ticksmanage.email>");
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);

        mailSender.send(msg);
    }
}
