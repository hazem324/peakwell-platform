package tn.esprit.peakwell.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.enums.EventStatus;
import tn.esprit.peakwell.repositories.EventRegistrationRepository;
import tn.esprit.peakwell.repositories.SportEventRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SportEventService {
    private final EventRegistrationRepository registrationRepository;
    private final EmailService emailService;
    private final SportEventRepository sportEventRepository;
    private final AiTrainingSyncService aiTrainingSyncService;

    public SportEventService(SportEventRepository sportEventRepository,
                             AiTrainingSyncService aiTrainingSyncService,
                             EventRegistrationRepository registrationRepository,
                             EmailService emailService) {
        this.sportEventRepository = sportEventRepository;
        this.aiTrainingSyncService = aiTrainingSyncService;
        this.registrationRepository = registrationRepository;
        this.emailService = emailService;
    }

    public List<SportEvent> getAllEvents() {
        // Met à jour en base les événements expirés
        sportEventRepository.updateExpiredEvents();

        List<SportEvent> events = sportEventRepository.findAll();

        for (SportEvent event : events) {
            applyRuntimeStatus(event);
        }

        return events;
    }

    public SportEvent getEventById(Long id) {
        // Met à jour en base les événements expirés
        sportEventRepository.updateExpiredEvents();

        SportEvent event = sportEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        applyRuntimeStatus(event);
        return event;
    }

    public SportEvent createEvent(SportEvent event) {
        if (event.getCurrentParticipants() == null) {
            event.setCurrentParticipants(0);
        }

        event.updateStatusBasedOnCapacity();
        return sportEventRepository.save(event);
    }

    public SportEvent updateEvent(Long id, SportEvent updatedEvent) {
        sportEventRepository.updateExpiredEvents();

        SportEvent existingEvent = sportEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        if (existingEvent.getStatus() == EventStatus.FINISHED) {
            throw new IllegalArgumentException("Finished events cannot be modified.");
        }

        EventStatus oldStatus = existingEvent.getStatus();

        existingEvent.setTitle(updatedEvent.getTitle());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setEventDate(updatedEvent.getEventDate());
        existingEvent.setLocation(updatedEvent.getLocation());
        existingEvent.setLatitude(updatedEvent.getLatitude());
        existingEvent.setLongitude(updatedEvent.getLongitude());
        existingEvent.setCategory(updatedEvent.getCategory());
        existingEvent.setEventDetail(updatedEvent.getEventDetail());
        existingEvent.setMaxParticipants(updatedEvent.getMaxParticipants());
        existingEvent.setCurrentParticipants(updatedEvent.getCurrentParticipants());
        existingEvent.setImageUrl(updatedEvent.getImageUrl());

        if (updatedEvent.getStatus() != null) {
            existingEvent.setStatus(updatedEvent.getStatus());
        }

        if (existingEvent.getStatus() != EventStatus.CANCELLED &&
                existingEvent.getStatus() != EventStatus.FINISHED) {
            existingEvent.updateStatusBasedOnCapacity();
        }

        SportEvent savedEvent = sportEventRepository.save(existingEvent);

        if (oldStatus != EventStatus.CANCELLED && savedEvent.getStatus() == EventStatus.CANCELLED) {
            sendCancellationEmailsToRegisteredUsers(savedEvent);
        }

        return savedEvent;
    }


    public void deleteEvent(Long id) {
        SportEvent event = sportEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        sportEventRepository.delete(event);
    }

    private boolean isExpired(SportEvent event) {
        return event.getEventDate() != null && event.getEventDate().isBefore(LocalDateTime.now());
    }

    private void applyRuntimeStatus(SportEvent event) {
        if (isExpired(event)) {
            event.setStatus(EventStatus.FINISHED);
        } else {
            event.updateStatusBasedOnCapacity();
        }
    }




    //LECODE DE PREDICTION

    @Transactional
    public void exportFinishedEventsToAiDataset() {
        sportEventRepository.updateExpiredEvents();

        List<SportEvent> finishedEvents =
                sportEventRepository.findByStatusAndExportedToAiDatasetFalse(EventStatus.FINISHED);

        System.out.println("Finished events to export: " + finishedEvents.size());

        for (SportEvent event : finishedEvents) {
            try {
                System.out.println("Before export -> Event ID: " + event.getId()
                        + ", exported: " + event.getExportedToAiDataset());

                aiTrainingSyncService.sendFinishedEventToFlask(event);

                sportEventRepository.markAsExported(event.getId());

                System.out.println("After export -> Event ID: " + event.getId()
                        + " marked as exported in database.");
            } catch (Exception e) {
                System.out.println("Failed to export event " + event.getId()
                        + " to AI dataset: " + e.getMessage());
            }
        }
    }

    public void retrainAiModel() {
        try {
            aiTrainingSyncService.callRetrain();
            System.out.println("AI model retrained successfully.");
        } catch (Exception e) {
            System.out.println("Failed to retrain AI model: " + e.getMessage());
        }
    }


    private void sendCancellationEmailsToRegisteredUsers(SportEvent event) {
        try {
            List<EventRegistration> registrations = registrationRepository.findByEventId(event.getId());

            for (EventRegistration registration : registrations) {
                try {
                    if (registration.getStudent() == null || registration.getStudent().getUser() == null) {
                        continue;
                    }

                    User user = registration.getStudent().getUser();

                    String to = user.getEmail();
                    if (to == null || to.isBlank()) {
                        continue;
                    }

                    String studentName = user.getFirstName() != null ? user.getFirstName() : "Student";
                    String eventTitle = event.getTitle();
                    String date = event.getEventDate() != null ? event.getEventDate().toString() : "scheduled date";
                    String location = event.getLocation();

                    emailService.sendEventCancelledEmail(to, studentName, eventTitle, date, location);

                } catch (Exception ex) {
                    System.out.println("Failed to send cancellation email to one user: " + ex.getMessage());
                }
            }

        } catch (Exception e) {
            System.out.println("Failed to send cancellation emails: " + e.getMessage());
        }
    }
}