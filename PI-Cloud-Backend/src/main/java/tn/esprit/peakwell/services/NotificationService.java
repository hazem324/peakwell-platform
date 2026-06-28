package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

  private final NotificationRepository notifRepo;
  private final MedicalProfileRepository profileRepo;
  private final BiometricEntryRepository biometricRepo;
  private final HealthGoalRepository goalRepo;
  private final ConsultationRepository consultRepo;
  private final SymptomEntryRepository symptomRepo;
  private final DietitianRepository dietitianRepo;

  private static final Long DEFAULT_PROFILE_ID = 1L;

  // ── CRUD ────────────────────────────────────────

  public List<Notification> getAll(Long profileId) {
    return notifRepo.findAllByProfileIdAndDismissedFalseOrderByCreatedAtDesc(
            profileId != null ? profileId : DEFAULT_PROFILE_ID);
  }

  public long getUnreadCount(Long profileId) {
    return notifRepo.countByProfileIdAndReadFalseAndDismissedFalse(
            profileId != null ? profileId : DEFAULT_PROFILE_ID);
  }

  @Transactional
  public Notification markAsRead(Long notifId, Long callerProfileId) {
    Notification n = notifRepo.findById(notifId).orElseThrow(() -> new RuntimeException("Notification not found"));
    if (!n.getProfile().getId().equals(callerProfileId)) return n; // silently ignore wrong owner
    n.setRead(true);
    n.setReadAt(LocalDateTime.now());
    return notifRepo.save(n);
  }

  @Transactional
  public void markAllAsRead(Long profileId) {
    List<Notification> unread = notifRepo.findAllByProfileIdAndDismissedFalseOrderByCreatedAtDesc(
            profileId != null ? profileId : DEFAULT_PROFILE_ID);
    unread.stream().filter(n -> !n.getRead()).forEach(n -> {
      n.setRead(true);
      n.setReadAt(LocalDateTime.now());
    });
    notifRepo.saveAll(unread);
  }

  @Transactional
  public void dismiss(Long notifId, Long callerProfileId) {
    Notification n = notifRepo.findById(notifId).orElseThrow();
    if (!n.getProfile().getId().equals(callerProfileId)) return; // silently ignore wrong owner
    n.setDismissed(true);
    notifRepo.save(n);
  }

  @Transactional
  public void dismissAll(Long profileId) {
    List<Notification> all = notifRepo.findAllByProfileIdAndDismissedFalseOrderByCreatedAtDesc(
            profileId != null ? profileId : DEFAULT_PROFILE_ID);
    all.forEach(n -> n.setDismissed(true));
    notifRepo.saveAll(all);
  }

  // ── Manual trigger (called from controller or on biometric save) ──

  @Transactional
  public List<Notification> checkAndNotify(Long profileId) {
    Long pid = profileId != null ? profileId : DEFAULT_PROFILE_ID;
    MedicalProfile profile = profileRepo.findById(pid).orElse(null);
    if (profile == null) return List.of();

    List<Notification> generated = new ArrayList<>();
    List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(pid);
    BiometricEntry latest = entries.isEmpty() ? null : entries.get(entries.size() - 1);
    BiometricEntry previous = entries.size() >= 2 ? entries.get(entries.size() - 2) : null;

    String patientName = (profile.getFirstName() != null ? profile.getFirstName() : "") + " " +
            (profile.getLastName() != null ? profile.getLastName() : "");

    if (latest == null) return generated;

    // ── 1. CRITICAL RISK — Red Zone Alert ──────────
    double healthScore = computeHealthScore(profile, latest, entries);
    if (healthScore < 35) {
      generated.add(createIfNotExists(profile, "CRITICAL_RISK", "CRITICAL",
              "🚨 Critical Health Alert",
              "Your health score is critically low (" + Math.round(healthScore) + "/100). " +
                      "Multiple health indicators need immediate attention. " +
                      "Please book a consultation with your dietitian as soon as possible.",
              "🚨", "/dossier?tab=consultations", "Book Appointment Now"));
    } else if (healthScore < 50) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "HIGH",
              "⚠️ Health Score Declining",
              "Your health score has dropped to " + Math.round(healthScore) + "/100. " +
                      "Consider scheduling a check-up to review your progress.",
              "⚠️", "/dossier?tab=consultations", "Schedule Check-up"));
    }

    // ── 2. BMI Alert ───────────────────────────────
    if (latest.getBmi() != null && latest.getBmi() > 30) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "HIGH",
              "⚖️ BMI in Obese Range",
              "Your current BMI is " + latest.getBmi() + " which is in the obese range. " +
                      "Your dietitian can help adjust your nutrition plan.",
              "⚖️", "/dossier?tab=dashboard", "View Health Dashboard"));
    }

    // ── 3. Blood Pressure Alert ────────────────────
    if (latest.getSystolic() != null && latest.getSystolic() > 140) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "CRITICAL",
              "❤️ High Blood Pressure Detected",
              "Your systolic blood pressure is " + latest.getSystolic() + " mmHg (hypertension range). " +
                      "Please consult your doctor immediately.",
              "❤️", "/dossier?tab=consultations", "Book Urgent Appointment"));
    } else if (latest.getSystolic() != null && latest.getSystolic() > 130) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "MEDIUM",
              "❤️ Elevated Blood Pressure",
              "Your blood pressure is elevated at " + latest.getSystolic() + "/" + latest.getDiastolic() + " mmHg. " +
                      "Monitor closely and consider dietary changes.",
              "❤️", "/dossier?tab=alerts", "View Details"));
    }

    // ── 4. Glucose Alert ───────────────────────────
    if (latest.getGlucose() != null && latest.getGlucose() > 126) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "CRITICAL",
              "🩸 Glucose in Diabetic Range",
              "Your fasting glucose is " + latest.getGlucose() + " mg/dL which indicates diabetes. " +
                      "Urgent consultation recommended.",
              "🩸", "/dossier?tab=consultations", "Book Appointment"));
    } else if (latest.getGlucose() != null && latest.getGlucose() > 100) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "MEDIUM",
              "🩸 Pre-diabetic Glucose Level",
              "Your glucose level is " + latest.getGlucose() + " mg/dL (pre-diabetic range). " +
                      "Dietary adjustments recommended.",
              "🩸", "/dossier?tab=dashboard", "Review Diet Plan"));
    }

    // ── 5. Rapid Weight Change ─────────────────────
    if (previous != null) {
      double weightDelta = latest.getWeight() - previous.getWeight();
      if (weightDelta > 3) {
        generated.add(createIfNotExists(profile, "HEALTH_ALERT", "HIGH",
                "⚖️ Rapid Weight Gain",
                "You've gained " + Math.round(weightDelta * 10.0) / 10.0 + " kg since your last measurement. " +
                        "This could indicate fluid retention or dietary changes that need review.",
                "⚖️", "/dossier?tab=consultations", "Discuss with Dietitian"));
      }
    }

    // ── 6. Overdue Goals ───────────────────────────
    List<HealthGoal> overdueGoals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid).stream()
            .filter(g -> g.getActive() != null && g.getActive()
                    && g.getDeadline() != null && g.getDeadline().isBefore(LocalDate.now()))
            .toList();
    if (!overdueGoals.isEmpty()) {
      generated.add(createIfNotExists(profile, "GOAL_UPDATE", "MEDIUM",
              "⏰ " + overdueGoals.size() + " Goal" + (overdueGoals.size() > 1 ? "s" : "") + " Overdue",
              "You have overdue health goals. Consider updating your targets or booking a consultation to reassess.",
              "⏰", "/dossier?tab=goals", "Review Goals"));
    }

    // ── 7. Goal Achieved — Celebration! ────────────
    List<HealthGoal> recentlyAchieved = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid).stream()
            .filter(g -> g.getAchieved() != null && g.getAchieved()
                    && g.getAchievedDate() != null
                    && g.getAchievedDate().isAfter(LocalDate.now().minusDays(3)))
            .toList();
    for (HealthGoal g : recentlyAchieved) {
      generated.add(createIfNotExists(profile, "GOAL_UPDATE", "LOW",
              "🎉 Goal Achieved!",
              "Congratulations! You've achieved your " + g.getDirection() + " " + g.getMetric() + " goal " +
                      "(" + g.getStartValue() + " → " + g.getTargetValue() + " " + g.getUnit() + "). Keep up the great work!",
              "🎉", "/dossier?tab=goals", "View Goals"));
    }

    // ── 8. No recent entries ───────────────────────
    if (!entries.isEmpty()) {
      long daysSince = ChronoUnit.DAYS.between(entries.get(entries.size() - 1).getRecordedAt(), LocalDateTime.now());
      if (daysSince >= 7 && daysSince < 14) {
        generated.add(createIfNotExists(profile, "SYSTEM", "LOW",
                "📊 Weekly Check-in Due",
                "It's been " + daysSince + " days since your last measurement. " +
                        "Weekly tracking keeps your progress on track!",
                "📊", "/dossier?tab=add", "Log Measurement"));
      } else if (daysSince >= 14) {
        generated.add(createIfNotExists(profile, "SYSTEM", "MEDIUM",
                "📊 Time to Log a Measurement",
                "It's been " + daysSince + " days since your last biometric entry. " +
                        "Regular tracking helps your dietitian help you better.",
                "📊", "/dossier?tab=add", "Add Measurement"));
      }
    }

    // ── 9. Rapid weight loss ───────────────────────
    if (previous != null) {
      double weightDelta = latest.getWeight() - previous.getWeight();
      if (weightDelta < -2) {
        generated.add(createIfNotExists(profile, "HEALTH_ALERT", "MEDIUM",
                "⚖️ Rapid Weight Loss Detected",
                "You've lost " + Math.abs(Math.round(weightDelta * 10.0) / 10.0) + " kg since your last measurement. " +
                        "Rapid weight loss can be concerning — make sure you're following your nutrition plan.",
                "⚖️", "/dossier?tab=consultations", "Discuss with Dietitian"));
      }
    }

    // ── 10. Underweight BMI ────────────────────────
    if (latest.getBmi() != null && latest.getBmi() < 18.5) {
      generated.add(createIfNotExists(profile, "HEALTH_ALERT", "HIGH",
              "⚖️ BMI in Underweight Range",
              "Your current BMI is " + latest.getBmi() + " which is below the healthy range. " +
                      "Please discuss a nutrition plan with your dietitian to reach a healthy weight.",
              "⚖️", "/dossier?tab=consultations", "Book Appointment"));
    }

    // ── 11. Incomplete medical profile ────────────
    if (!Boolean.TRUE.equals(profile.getComplete())) {
      generated.add(createIfNotExists(profile, "SYSTEM", "LOW",
              "📋 Complete Your Medical Profile",
              "Your medical profile is incomplete. A complete profile helps your dietitian " +
                      "provide better personalised recommendations.",
              "📋", "/dossier?tab=profile", "Complete Profile"));
    }

    // ── 12. Goal deadline approaching (within 7 days) ──
    List<HealthGoal> approachingGoals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid).stream()
            .filter(g -> Boolean.TRUE.equals(g.getActive())
                    && !Boolean.TRUE.equals(g.getAchieved())
                    && g.getDeadline() != null
                    && !g.getDeadline().isBefore(LocalDate.now())
                    && g.getDeadline().isBefore(LocalDate.now().plusDays(7)))
            .toList();
    if (!approachingGoals.isEmpty()) {
      HealthGoal g = approachingGoals.get(0);
      long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), g.getDeadline());
      generated.add(createIfNotExists(profile, "GOAL_UPDATE", "MEDIUM",
              "⏳ Goal Deadline in " + daysLeft + " Day(s)",
              "Your " + g.getMetric() + " goal deadline is approaching (due " +
                      g.getDeadline().format(DateTimeFormatter.ofPattern("MMM d")) + "). " +
                      "Target: " + g.getTargetValue() + " " + (g.getUnit() != null ? g.getUnit() : "") + ". Keep pushing!",
              "⏳", "/dossier?tab=goals", "Review Goal"));
    }

    // ── 13. Upcoming consultation reminder (48 h) ──
    List<Consultation> upcoming = consultRepo.findAllByProfileIdOrderByScheduledAtDesc(pid).stream()
            .filter(c -> "UPCOMING".equals(c.getStatus()))
            .filter(c -> c.getScheduledAt().isAfter(LocalDateTime.now()))
            .filter(c -> c.getScheduledAt().isBefore(LocalDateTime.now().plusHours(48)))
            .toList();
    for (Consultation c : upcoming) {
      long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(), c.getScheduledAt());
      String timeLabel = hoursUntil <= 24 ? "in " + hoursUntil + " hour(s)" : "tomorrow";
      generated.add(createIfNotExists(profile, "APPOINTMENT_REMINDER", "MEDIUM",
              "📅 Consultation " + timeLabel.substring(0, 1).toUpperCase() + timeLabel.substring(1),
              "You have a consultation with " + c.getDoctorName() + " scheduled " + timeLabel +
                      " on " + c.getScheduledAt().format(DateTimeFormatter.ofPattern("MMM d 'at' HH:mm")) + ".",
              "📅", "/dossier?tab=consultations", "View Appointment"));
    }

    generated.removeIf(Objects::isNull);
    return generated;
  }

  // ── Instant: goal assigned by nutritionist ──────

  @Transactional
  public void notifyGoalAssigned(MedicalProfile profile, String metric, String dietitianName) {
    String display = metric.substring(0, 1).toUpperCase()
            + metric.substring(1).replaceAll("([A-Z])", " $1");
    // Always create — each goal assignment is a distinct event, no dedup
    Notification n = Notification.builder()
            .profile(profile)
            .type("GOAL_UPDATE")
            .severity("LOW")
            .title("🎯 New Goal Assigned")
            .message("Your nutritionist " + dietitianName + " has assigned you a new " + display
                    + " goal. Head to your Goals tab to see the details and track your progress.")
            .icon("🎯")
            .actionUrl("/dossier?tab=goals")
            .actionLabel("View Goal")
            .build();
    notifRepo.save(n);
  }

  // ── Dietitian CRUD ──────────────────────────────

  public List<Notification> getDietitianAll(Long dietitianId) {
    return notifRepo.findAllByDietitianIdAndDismissedFalseOrderByCreatedAtDesc(dietitianId);
  }

  public long getDietitianUnreadCount(Long dietitianId) {
    return notifRepo.countByDietitianIdAndReadFalseAndDismissedFalse(dietitianId);
  }

  @Transactional
  public Notification markAsReadForDietitian(Long notifId, Long callerDietitianId) {
    Notification n = notifRepo.findById(notifId).orElseThrow();
    if (n.getDietitian() == null || !n.getDietitian().getId().equals(callerDietitianId)) return n;
    n.setRead(true);
    n.setReadAt(LocalDateTime.now());
    return notifRepo.save(n);
  }

  @Transactional
  public void markAllAsReadForDietitian(Long dietitianId) {
    notifRepo.findAllByDietitianIdAndDismissedFalseOrderByCreatedAtDesc(dietitianId)
            .stream().filter(n -> !n.getRead()).forEach(n -> {
              n.setRead(true);
              n.setReadAt(LocalDateTime.now());
            });
  }

  @Transactional
  public void dismissForDietitian(Long notifId, Long callerDietitianId) {
    Notification n = notifRepo.findById(notifId).orElseThrow();
    if (n.getDietitian() == null || !n.getDietitian().getId().equals(callerDietitianId)) return;
    n.setDismissed(true);
    notifRepo.save(n);
  }

  @Transactional
  public void dismissAllForDietitian(Long dietitianId) {
    notifRepo.findAllByDietitianIdAndDismissedFalseOrderByCreatedAtDesc(dietitianId)
            .forEach(n -> n.setDismissed(true));
  }

  // ── Dietitian instant notifications ─────────────

  /** Called when a student books a consultation with this dietitian. */
  @Transactional
  public void notifyNewBooking(Dietitian dietitian, String patientName, String scheduledAt) {
    createForDietitianIfNotExists(dietitian, "APPOINTMENT_REMINDER", "MEDIUM",
            "📅 New Consultation Request",
            patientName + " has booked a consultation with you on " + scheduledAt +
                    ". Head to your schedule to confirm or reschedule.",
            "📅", "/nutritionist/schedule", "View Schedule");
  }

  /** Called when a student cancels a consultation. */
  @Transactional
  public void notifyConsultationCancelled(Dietitian dietitian, String patientName, String scheduledAt) {
    // Always create — each cancellation is a distinct event
    Notification n = Notification.builder()
            .dietitian(dietitian)
            .type("APPOINTMENT_REMINDER")
            .severity("MEDIUM")
            .title("❌ Consultation Cancelled")
            .message(patientName + " has cancelled their consultation scheduled for " + scheduledAt + ".")
            .icon("❌")
            .actionUrl("/nutritionist/schedule")
            .actionLabel("View Schedule")
            .build();
    notifRepo.save(n);
  }

  /** Called when a patient pauses a goal — notifies their assigned dietitian. */
  @Transactional
  public void notifyGoalPaused(Dietitian dietitian, String patientName, String metric, String reason) {
    String display = metric.substring(0, 1).toUpperCase()
            + metric.substring(1).replaceAll("([A-Z])", " $1");
    String reasonPart = (reason != null && !reason.isBlank()) ? " Reason: \"" + reason + "\"." : "";
    Notification n = Notification.builder()
            .dietitian(dietitian)
            .type("GOAL_UPDATE")
            .severity("MEDIUM")
            .title("⏸️ Goal Paused: " + patientName)
            .message(patientName + " has paused their " + display + " goal." + reasonPart
                    + " You may want to check in with them.")
            .icon("⏸️")
            .actionUrl("/nutritionist/clients")
            .actionLabel("View Client")
            .build();
    notifRepo.save(n);
  }

  /** Called when a student achieves a goal assigned by this dietitian. */
  @Transactional
  public void notifyGoalAchieved(Dietitian dietitian, String patientName, String metric) {
    String display = metric.substring(0, 1).toUpperCase()
            + metric.substring(1).replaceAll("([A-Z])", " $1");
    Notification n = Notification.builder()
            .dietitian(dietitian)
            .type("GOAL_UPDATE")
            .severity("LOW")
            .title("🎉 Goal Achieved!")
            .message(patientName + " has achieved their " + display + " goal that you assigned. Great results!")
            .icon("🎉")
            .actionUrl("/nutritionist/clients")
            .actionLabel("View Client")
            .build();
    notifRepo.save(n);
  }

  // ── Instant dietitian alert when a patient's biometrics are saved ──

  @Transactional
  public void checkAndNotifyDietitianForProfile(Long profileId) {
    MedicalProfile p = profileRepo.findById(profileId).orElse(null);
    if (p == null || p.getAssignedDietitian() == null) return;

    Dietitian d = p.getAssignedDietitian();
    List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(profileId);
    if (entries.isEmpty()) return;

    BiometricEntry latest = entries.get(entries.size() - 1);
    String name = ((p.getFirstName() != null ? p.getFirstName() : "") +
            " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
    double score = computeHealthScore(p, latest, entries);

    if (score < 35) {
      createForDietitianIfNotExists(d, "CRITICAL_RISK", "CRITICAL",
              "🚨 Critical Health Alert: " + name,
              name + "'s health score has dropped to a critical level (" + (int) score + "/100). " +
                      "Their biometrics indicate serious risk — immediate review is recommended.",
              "🚨", "/nutritionist/clients", "View Client");
    } else if (score < 50) {
      createForDietitianIfNotExists(d, "HEALTH_ALERT", "HIGH",
              "⚠️ " + name + "'s Health Is Declining",
              name + "'s health score is " + (int) score + "/100 (High risk). " +
                      "Review their recent biometrics and consider adjusting their nutrition plan.",
              "⚠️", "/nutritionist/clients", "View Client");
    }
  }

  // ── Dietitian scheduled scan — upcoming consultations ──

  @Transactional
  public void checkAndNotifyDietitians() {
    List<Dietitian> all = dietitianRepo.findAll();
    for (Dietitian d : all) {
      // Upcoming consultation in next 24 h — query by dietitian to avoid full table scan
      LocalDateTime now = LocalDateTime.now();
      List<Consultation> upcoming = consultRepo.findByDietitianIdAndStatusOrderByScheduledAtAsc(d.getId(), "UPCOMING")
              .stream()
              .filter(c -> c.getScheduledAt() != null
                      && c.getScheduledAt().isAfter(now)
                      && c.getScheduledAt().isBefore(now.plusHours(24)))
              .toList();

      for (Consultation c : upcoming) {
        String patientName = c.getProfile() != null && c.getProfile().getFirstName() != null
                ? c.getProfile().getFirstName() + " " + c.getProfile().getLastName()
                : "A patient";
        long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(), c.getScheduledAt());
        String timeLabel = hoursUntil <= 1 ? "in less than an hour"
                : hoursUntil <= 4 ? "in " + hoursUntil + " hours"
                : "tomorrow";
        createForDietitianIfNotExists(d, "APPOINTMENT_REMINDER", "MEDIUM",
                "📅 Upcoming Consultation: " + patientName,
                "You have a consultation with " + patientName + " " + timeLabel +
                        " on " + c.getScheduledAt().format(DateTimeFormatter.ofPattern("MMM d 'at' HH:mm")) + ".",
                "📅", "/nutritionist/schedule", "View Schedule");
      }

      // Clients health monitoring — inactivity + health risk
      List<MedicalProfile> clients = profileRepo.findByDietitianScope(d.getId());
      for (MedicalProfile p : clients) {
        List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(p.getId());
        if (entries.isEmpty()) continue;
        BiometricEntry latest = entries.get(entries.size() - 1);
        String name = ((p.getFirstName() != null ? p.getFirstName() : "") +
                " " + (p.getLastName() != null ? p.getLastName() : "")).trim();

        // Inactivity alert
        long daysSince = ChronoUnit.DAYS.between(latest.getRecordedAt(), LocalDateTime.now());
        if (daysSince >= 14) {
          createForDietitianIfNotExists(d, "SYSTEM", "LOW",
                  "📊 " + name + " Hasn't Logged Data",
                  name + " hasn't logged any biometric data in " + daysSince +
                          " days. Consider reaching out to keep them on track.",
                  "📊", "/nutritionist/clients", "View Client");
        }

        // Health score risk alerts
        double score = computeHealthScore(p, latest, entries);
        if (score < 35) {
          createForDietitianIfNotExists(d, "CRITICAL_RISK", "CRITICAL",
                  "🚨 Critical Health Alert: " + name,
                  name + "'s health score has dropped to a critical level (" + (int) score + "/100). " +
                          "Their biometrics indicate serious risk — immediate review is recommended.",
                  "🚨", "/nutritionist/clients", "View Client");
        } else if (score < 50) {
          createForDietitianIfNotExists(d, "HEALTH_ALERT", "HIGH",
                  "⚠️ " + name + "'s Health Is Declining",
                  name + "'s health score is " + (int) score + "/100 (High risk). " +
                          "Review their recent biometrics and consider adjusting their nutrition plan.",
                  "⚠️", "/nutritionist/clients", "View Client");
        }
      }
    }
  }

  private void createForDietitianIfNotExists(Dietitian dietitian, String type, String severity,
                                             String title, String message, String icon,
                                             String actionUrl, String actionLabel) {
    boolean exists = notifRepo.existsByDietitianIdAndTypeAndTitleAndCreatedAtAfter(
            dietitian.getId(), type, title, LocalDateTime.now().minusHours(24));
    if (exists) return;
    Notification n = Notification.builder()
            .dietitian(dietitian)
            .type(type)
            .severity(severity)
            .title(title)
            .message(message)
            .icon(icon)
            .actionUrl(actionUrl)
            .actionLabel(actionLabel)
            .build();
    notifRepo.save(n);
  }

  // ── Scheduled scanner — runs every 6 hours ─────

  @Scheduled(fixedRate = 21600000) // 6 hours
  @Transactional
  public void scheduledScan() {
    log.info("Running scheduled notification scan...");
    List<MedicalProfile> allProfiles = profileRepo.findAll();
    int total = 0;
    for (MedicalProfile p : allProfiles) {
      List<Notification> generated = checkAndNotify(p.getId());
      total += generated.size();
    }
    log.info("Notification scan complete: {} notifications generated for {} profiles", total, allProfiles.size());
    checkAndNotifyDietitians();
  }

  // ── Health Score (same logic as heatmap) ────────

  private double computeHealthScore(MedicalProfile profile, BiometricEntry latest, List<BiometricEntry> entries) {
    if (latest == null) return 50;
    double score = 100;

    double bmi = latest.getBmi() != null ? latest.getBmi() : 25;
    if (bmi > 30) score -= 20;
    else if (bmi > 27) score -= 12;
    else if (bmi > 25) score -= 5;
    else if (bmi < 18.5) score -= 10;

    if (latest.getSystolic() != null) {
      if (latest.getSystolic() > 140) score -= 18;
      else if (latest.getSystolic() > 130) score -= 10;
    }

    if (latest.getGlucose() != null) {
      if (latest.getGlucose() > 126) score -= 18;
      else if (latest.getGlucose() > 100) score -= 8;
    }

    if (latest.getBodyFat() != null && latest.getBodyFat() > 35) score -= 10;

    if (profile.getConditions() != null)
      score -= Math.min(profile.getConditions().size() * 6, 24);

    if (entries.size() >= 2) {
      BiometricEntry prev = entries.get(entries.size() - 2);
      double wd = latest.getWeight() - prev.getWeight();
      if (wd > 2) score -= 8;
      else if (wd < -1) score += 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ── Dedup helper — don't create same notification twice in 24h ──

  private Notification createIfNotExists(MedicalProfile profile, String type, String severity,
                                         String title, String message, String icon,
                                         String actionUrl, String actionLabel) {
    boolean exists = notifRepo.existsByProfileIdAndTypeAndTitleAndCreatedAtAfter(
            profile.getId(), type, title, LocalDateTime.now().minusHours(24));
    if (exists) return null;

    Notification n = Notification.builder()
            .profile(profile)
            .type(type)
            .severity(severity)
            .title(title)
            .message(message)
            .icon(icon)
            .actionUrl(actionUrl)
            .actionLabel(actionLabel)
            .build();
    return notifRepo.save(n);
  }
}