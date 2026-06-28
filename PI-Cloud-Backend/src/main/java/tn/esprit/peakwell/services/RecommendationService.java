package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.enums.EventCategory;
import tn.esprit.peakwell.repositories.EventRegistrationRepository;
import tn.esprit.peakwell.repositories.SportEventRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final EventRegistrationRepository registrationRepository;
    private final SportEventRepository sportEventRepository;

    public RecommendationService(EventRegistrationRepository registrationRepository,
                                 SportEventRepository sportEventRepository) {
        this.registrationRepository = registrationRepository;
        this.sportEventRepository = sportEventRepository;
    }

    public List<SportEvent> recommendEvents(Long studentId) {
        List<EventRegistration> registrations = registrationRepository.findByStudent_Id(studentId);

        Set<Long> joinedEventIds = registrations.stream()
                .filter(r -> r.getEvent() != null && r.getEvent().getId() != null)
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        Map<EventCategory, Long> categoryCount = registrations.stream()
                .filter(r -> r.getEvent() != null && r.getEvent().getCategory() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getEvent().getCategory(),
                        Collectors.counting()
                ));

        EventCategory favoriteCategory = categoryCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        List<SportEvent> futureEvents = sportEventRepository.findAvailableFutureEvents(LocalDateTime.now());

        List<SportEvent> candidates = futureEvents.stream()
                .filter(e -> e.getId() != null && !joinedEventIds.contains(e.getId()))
                .collect(Collectors.toList());

        candidates.sort((e1, e2) -> Integer.compare(
                scoreEvent(e2, favoriteCategory),
                scoreEvent(e1, favoriteCategory)
        ));

        return candidates.stream()
                .limit(3)
                .collect(Collectors.toList());
    }

    private int scoreEvent(SportEvent event, EventCategory favoriteCategory) {
        int score = 0;

        if (favoriteCategory != null && event.getCategory() == favoriteCategory) {
            score += 5;
        }

        if (event.getStatus() != null) {
            switch (event.getStatus()) {
                case OPEN -> score += 3;
                case FULL -> score += 1;
                default -> score += 0;
            }
        }

        if (event.getCurrentParticipants() != null) {
            score += Math.min(event.getCurrentParticipants(), 3);
        }

        return score;
    }
}