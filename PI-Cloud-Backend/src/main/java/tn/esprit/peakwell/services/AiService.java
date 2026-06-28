package tn.esprit.peakwell.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiService implements IAiService {

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.model}")
    private String model;

    @Value("${ia.face.api.key}")
    private String faceApiKey;

    @Value("${ai.face.api.secret}")
    private String faceApiSecret;

    @Value("${ai.face.api.url}")
    private String faceApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String generateBanMessage(String reason) {

        try {
            // Build request body
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content",
                                    "Write a professional email to inform a user that their account has been banned due to "
                                            + reason + ". " +
                                            "The email must:\n" +
                                            "- Be polite and professional\n" +
                                            "- Be 3 to 5 sentences\n" +
                                            "- Explain the reason clearly\n" +
                                            "- Include a support/help sentence\n" +
                                            "- End with 'Best regards, PeakWell Team'\n" +
                                            "- Do NOT include subject line\n" +
                                            "Return only the email body.")));

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Call API
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);

            // Extract response safely
            List choices = (List) response.getBody().get("choices");
            if (choices == null || choices.isEmpty()) {
                return fallback(reason);
            }

            Map choice = (Map) choices.get(0);
            Map message = (Map) choice.get("message");

            return (String) message.get("content");

        } catch (Exception e) {
            System.out.println(e);
            return fallback(reason);
        }
    }

    // fallback (important)
    private String fallback(String reason) {
        switch (reason) {
            case "SPAM":
                return "Your account has been suspended due to repeated spam activity.";
            case "ABUSE":
                return "Your account has been banned due to violation of community guidelines.";
            case "FAKE_ACCOUNT":
                return "Your account has been identified as fraudulent and has been disabled.";
            default:
                return "Your account has been restricted due to policy violations.";
        }
    }

    @Override
    public double compareFaces(String imageBase64, String storedImageUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("api_key", faceApiKey);
            body.add("api_secret", faceApiSecret);
            body.add("image_base64_1", imageBase64); // from Angular camera
            body.add("image_url2", storedImageUrl); // stored in DB

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(faceApiUrl, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object confidence = response.getBody().get("confidence");
                if (confidence != null) {
                    return Double.parseDouble(confidence.toString());
                }
            }

            return -1.0;

        } catch (Exception e) {
            System.err.println("[FaceCompare] Error calling Face++ API: " + e.getMessage());
            return -1.0;
        }
    }
}