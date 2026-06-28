package tn.esprit.peakwell.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateSummary(String title, String content) {
        String prompt = """
                    You are an AI assistant.
                
                    Summarize this article
                
                    Title: %s
                    Content: %s
                """.formatted(title, content);

        return callGroq(prompt);
    }

    public String generateTags(String title, String content) {
        String prompt = """
                    Extract 3 to 5 tags.
                
                    Rules:
                    - lowercase
                    - comma separated only
                
                    Title: %s
                    Content: %s
                """.formatted(title, content);

        return callGroq(prompt);
    }

    private String callGroq(String prompt) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama-3.1-8b-instant");

        body.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
        ));

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(apiUrl, request, Map.class);

        Map<String, Object> resBody = response.getBody();

        List<Map<String, Object>> choices =
                (List<Map<String, Object>>) resBody.get("choices");

        Map<String, Object> message =
                (Map<String, Object>) choices.get(0).get("message");

        return message.get("content").toString();
    }
}
