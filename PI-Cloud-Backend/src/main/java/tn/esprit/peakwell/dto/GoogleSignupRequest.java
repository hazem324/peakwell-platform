package tn.esprit.peakwell.dto;

import lombok.Data;

@Data
public class GoogleSignupRequest {
    private String accessToken;
    private String role;
}
