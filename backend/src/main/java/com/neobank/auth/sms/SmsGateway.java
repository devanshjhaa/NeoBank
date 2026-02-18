package com.neobank.auth.sms;

public interface SmsGateway {

    void sendOtp(String phoneNumber, String otp);
}
