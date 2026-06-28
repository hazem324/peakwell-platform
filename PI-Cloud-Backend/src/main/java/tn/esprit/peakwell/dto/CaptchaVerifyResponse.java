package tn.esprit.peakwell.dto;

public record CaptchaVerifyResponse(
        boolean success,
        String  captchaToken,
        String  message
) {}
