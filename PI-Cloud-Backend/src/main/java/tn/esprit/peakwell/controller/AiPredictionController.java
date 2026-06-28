package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.EventPredictionRequest;
import tn.esprit.peakwell.dto.EventPredictionResponse;
import tn.esprit.peakwell.services.AiPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:4200")
public class AiPredictionController {

    private final AiPredictionService aiPredictionService;

    public AiPredictionController(AiPredictionService aiPredictionService) {
        this.aiPredictionService = aiPredictionService;
    }

    @PostMapping("/predict")
    public ResponseEntity<EventPredictionResponse> predict(@RequestBody EventPredictionRequest request) {
        EventPredictionResponse response = aiPredictionService.predict(request);
        return ResponseEntity.ok(response);
    }
}