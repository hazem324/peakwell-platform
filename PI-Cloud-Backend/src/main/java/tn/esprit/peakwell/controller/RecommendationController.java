package tn.esprit.peakwell.controller;

import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.services.RecommendationService;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:4200")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{studentId}")
    public List<SportEvent> getRecommendations(@PathVariable Long studentId) {
        return recommendationService.recommendEvents(studentId);
    }
}