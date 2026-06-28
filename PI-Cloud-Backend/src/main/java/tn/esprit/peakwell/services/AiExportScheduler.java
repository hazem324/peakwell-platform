package tn.esprit.peakwell.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AiExportScheduler {

    private final SportEventService sportEventService;

    public AiExportScheduler(SportEventService sportEventService) {
        this.sportEventService = sportEventService;
    }

    @Scheduled(fixedRate = 300000) // 5 minutes
    public void exportFinishedEvents() {
        System.out.println("AI export scheduler running...");
        sportEventService.exportFinishedEventsToAiDataset();
    }
}