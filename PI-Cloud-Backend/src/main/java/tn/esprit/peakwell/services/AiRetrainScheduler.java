package tn.esprit.peakwell.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AiRetrainScheduler {

    private final SportEventService sportEventService;

    public AiRetrainScheduler(SportEventService sportEventService) {
        this.sportEventService = sportEventService;
    }

    @Scheduled(fixedRate = 600000) // 10 minutes
    public void retrainModel() {
        System.out.println("AI retrain scheduler running...");
        sportEventService.retrainAiModel();
    }
}