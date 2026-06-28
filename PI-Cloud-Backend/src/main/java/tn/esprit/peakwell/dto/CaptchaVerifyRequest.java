package tn.esprit.peakwell.dto;

import java.util.List;

public record CaptchaVerifyRequest(
        String        challengeToken,
        List<Integer> selectedIndices
) {}