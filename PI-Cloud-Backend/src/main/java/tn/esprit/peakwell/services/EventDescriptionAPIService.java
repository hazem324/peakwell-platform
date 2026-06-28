package tn.esprit.peakwell.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.peakwell.enums.EventCategory;

@Service
public class EventDescriptionAPIService {

    @Value("${groq.api.key}")
    private String API_KEY;

    private final String URL = "https://api.groq.com/openai/v1/chat/completions";

    public String generateEventDescription(String title, EventCategory category, String eventDate){
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(API_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = """
Generate a SHORT event description in English for a university campus event.

Event title: %s
Event category: %s
Event date: %s

Rules:
- Write only 1 sentence.
- MUST use the exact provided date (do NOT invent days like Friday).
- Do NOT invent time or day.
- Sound like a real event announcement.
- No emojis.
- No markdown.
""".formatted(title, category, eventDate);

        prompt = prompt.replace("\n", " ");

        String body = """
        {
          "model": "openai/gpt-oss-120b",
          "messages": [
            {
              "role": "user",
              "content": "%s"
            }
          ]
        }
        """.formatted(prompt);

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(URL, request, String.class);

        return extractContent(response.getBody());
    }

    private String extractContent(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            return root
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText()
                    .trim();
        } catch (Exception e) {
            return "Error generating description";
        }
    }
}