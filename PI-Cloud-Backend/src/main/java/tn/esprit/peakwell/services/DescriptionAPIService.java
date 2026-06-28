package tn.esprit.peakwell.services;

import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;



@Service
public class DescriptionAPIService {

    @Value("${groq.api.key}")
    private String API_KEY;    

    private final String URL = "https://api.groq.com/openai/v1/chat/completions";

    public String generateDescription(String name, String ingredients) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(API_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = "Generate a SHORT (1 sentence only), clean and simple healthy food description " +
                "for the product: " + name +
                ". No markdown, no emojis, no formatting.";

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
                    .asText();
        } catch (Exception e) {
            return "Error generating description";
        }
    }

}
