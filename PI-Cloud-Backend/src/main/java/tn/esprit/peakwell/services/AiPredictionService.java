package tn.esprit.peakwell.services;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.peakwell.dto.EventPredictionRequest;
import tn.esprit.peakwell.dto.EventPredictionResponse;

@Service
public class AiPredictionService {

    private final RestTemplate restTemplate = new RestTemplate();

    public EventPredictionResponse predict(EventPredictionRequest request) {
        String flaskUrl = "http://localhost:5000/predict";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<EventPredictionRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<EventPredictionResponse> response = restTemplate.exchange(
                flaskUrl,
                HttpMethod.POST,
                entity,
                EventPredictionResponse.class
        );

        return response.getBody();
    }
}