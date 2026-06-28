package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.Consultation;
import tn.esprit.peakwell.entities.MedicalProfile;
import tn.esprit.peakwell.entities.Student;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.ConsultationRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationReminderScheduler {

    private final ConsultationRepository consultationRepo;
    private final EmailConsultationService emailService;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d 'at' HH:mm");

    // Runs every hour
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void sendReminders24h() {
        LocalDateTime from = LocalDateTime.now().plusHours(23);
        LocalDateTime to   = LocalDateTime.now().plusHours(25);

        List<Consultation> due = consultationRepo.findPendingReminders24h(from, to);
        log.info("[Reminder-24h] Found {} consultation(s) to remind", due.size());

        for (Consultation c : due) {
            try {
                String email = resolveEmail(c);
                String name  = resolveName(c);
                if (email == null) {
                    log.warn("[Reminder-24h] No email for consultation {}", c.getId());
                    continue;
                }

                String date = c.getScheduledAt().format(FORMATTER);
                emailService.sendReminder24h(email, name, c.getDoctorName(), date);

                c.setReminder24hSent(true);
                consultationRepo.save(c);
                log.info("[Reminder-24h] Sent to {} for consultation {}", email, c.getId());

            } catch (Exception e) {
                log.error("[Reminder-24h] Failed for consultation {}: {}", c.getId(), e.getMessage());
            }
        }
    }

    // Runs every 15 minutes (for the 1h reminder precision)
    @Scheduled(fixedRate = 900_000)
    @Transactional
    public void sendReminders1h() {
        LocalDateTime from = LocalDateTime.now().plusMinutes(50);
        LocalDateTime to   = LocalDateTime.now().plusMinutes(70);

        List<Consultation> due = consultationRepo.findPendingReminders1h(from, to);

        log.info("[Reminder-1h] Found {} consultation(s) to remind", due.size());

        for (Consultation c : due) {
            try {
                String email = resolveEmail(c);
                String name  = resolveName(c);
                if (email == null) {
                    log.warn("[Reminder-1h] No email for consultation {}", c.getId());
                    continue;
                }

                String date = c.getScheduledAt().format(FORMATTER);
                emailService.sendReminder1h(email, name, c.getDoctorName(), date);

                c.setReminder1hSent(true);
                consultationRepo.save(c);
                log.info("[Reminder-1h] Sent to {} for consultation {}", email, c.getId());

            } catch (Exception e) {
                log.error("[Reminder-1h] Failed for consultation {}: {}", c.getId(), e.getMessage());
            }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String resolveEmail(Consultation c) {
        User user = resolveUser(c);
        return user != null ? user.getEmail() : null;
    }

    private String resolveName(Consultation c) {
        User user = resolveUser(c);
        if (user != null && user.getFirstName() != null) return user.getFirstName();
        MedicalProfile p = c.getProfile();
        if (p != null && p.getFirstName() != null) return p.getFirstName();
        return "Patient";
    }

    private User resolveUser(Consultation c) {
        try {
            MedicalProfile profile = c.getProfile();
            if (profile == null) return null;
            Student student = profile.getStudent();
            if (student == null) return null;
            return student.getUser();
        } catch (Exception e) {
            return null;
        }
    }
}
