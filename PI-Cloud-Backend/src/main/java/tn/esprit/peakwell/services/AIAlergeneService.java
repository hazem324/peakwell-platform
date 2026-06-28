package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.peakwell.dto.PredictionAllergeneResponse;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIAlergeneService {

    private final RestTemplate restTemplate;

    public AIAlergeneService() {
        this.restTemplate = new RestTemplate();
    }

    public PredictionAllergeneResponse predictAllergens(String text) {

        String url = "http://localhost:8000/predict-allergens";

        // body request
        Map<String, String> request = new HashMap<>();
        request.put("text", text);

        // call API
        return restTemplate.postForObject(
                url,
                request,
                PredictionAllergeneResponse.class
        );
    }
}