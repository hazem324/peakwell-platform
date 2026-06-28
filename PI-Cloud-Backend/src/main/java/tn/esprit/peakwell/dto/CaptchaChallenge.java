package tn.esprit.peakwell.dto;

import java.util.List;

public record CaptchaChallenge(
        String       challengeToken,
        String       category,
        List<String> imageUrls
) {}