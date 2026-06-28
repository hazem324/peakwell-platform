package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthHeatmapService {

  private final MedicalProfileRepository profileRepo;
  private final BiometricEntryRepository biometricRepo;
  private final SymptomEntryRepository symptomRepo;
  private final HealthGoalRepository goalRepo;
  private final ConsultationRepository consultRepo;

  /**
   * Returns the full heatmap dashboard data:
   * - patients[] with x (health), y (engagement), bubble size, risk color
   * - actionItems[] prioritized to-do list
   * - quadrantSummary counts
   * - overallStats
   */
  public Map<String, Object> getHeatmapData(Long dietitianId) {
    List<MedicalProfile> profiles = (dietitianId != null)
        ? profileRepo.findByDietitianScope(dietitianId)
        : profileRepo.findAll();
    Map<String, Object> result = new LinkedHashMap<>();

    List<Map<String, Object>> patients = new ArrayList<>();
    List<Map<String, Object>> actionItems = new ArrayList<>();

    int qHighHigh = 0, qHighLow = 0, qLowHigh = 0, qLowLow = 0;
    double totalHealth = 0, totalEngage = 0;

    for (MedicalProfile profile : profiles) {
      Long pid = profile.getId();
      Map<String, Object> patient = new LinkedHashMap<>();

      // Basic info
      String firstName = profile.getFirstName() != null ? profile.getFirstName() : "";
      String lastName = profile.getLastName() != null ? profile.getLastName() : "";
      patient.put("profileId", pid);
      patient.put("studentId", profile.getStudent() != null ? profile.getStudent().getId() : null);
      patient.put("name", (firstName + " " + lastName).trim());
      patient.put("initials", ((firstName.isEmpty() ? "" : firstName.substring(0, 1)) +
        (lastName.isEmpty() ? "" : lastName.substring(0, 1))).toUpperCase());
      patient.put("gender", profile.getGender());

      // Biometric data
      List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(pid);
      BiometricEntry latest = entries.isEmpty() ? null : entries.get(entries.size() - 1);
      BiometricEntry previous = entries.size() >= 2 ? entries.get(entries.size() - 2) : null;

      // Compute health score (0-100)
      double healthScore = computeHealthScore(profile, latest, entries);
      patient.put("healthScore", round(healthScore));

      // Compute engagement score (0-100)
      double engagementScore = computeEngagementScore(pid, entries);
      patient.put("engagementScore", round(engagementScore));

      // Bubble size = number of entries (min 1, max capped)
      patient.put("entryCount", entries.size());
      patient.put("bubbleSize", Math.max(1, Math.min(entries.size(), 20)));

      // Risk color based on health score
      String riskColor;
      String riskTier;
      if (healthScore >= 75) { riskColor = "#7a9e7e"; riskTier = "Low"; }
      else if (healthScore >= 55) { riskColor = "#e8b84b"; riskTier = "Moderate"; }
      else if (healthScore >= 35) { riskColor = "#e88f68"; riskTier = "High"; }
      else { riskColor = "#c96a3f"; riskTier = "Critical"; }
      patient.put("riskColor", riskColor);
      patient.put("riskTier", riskTier);

      // Latest metrics for tooltip
      if (latest != null) {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("weight", latest.getWeight());
        metrics.put("bmi", latest.getBmi());
        if (latest.getSystolic() != null)
          metrics.put("bp", latest.getSystolic() + "/" + latest.getDiastolic());
        if (latest.getGlucose() != null) metrics.put("glucose", latest.getGlucose());
        if (latest.getBodyFat() != null) metrics.put("bodyFat", latest.getBodyFat());
        patient.put("latestMetrics", metrics);
        patient.put("lastEntry", latest.getRecordedAt().toString());
      }

      // Quadrant classification
      boolean highHealth = healthScore >= 50;
      boolean highEngage = engagementScore >= 50;
      if (highHealth && highEngage) qHighHigh++;
      else if (highHealth && !highEngage) qHighLow++;
      else if (!highHealth && highEngage) qLowHigh++;
      else qLowLow++;
      patient.put("quadrant", highHealth && highEngage ? "star" :
        highHealth && !highEngage ? "at_risk_churn" :
          !highHealth && highEngage ? "needs_plan_change" : "critical");

      patients.add(patient);
      totalHealth += healthScore;
      totalEngage += engagementScore;

      // ── Generate Action Items for this patient ──
      generateActionItems(actionItems, profile, latest, previous, entries, pid, healthScore, engagementScore);
    }

    // Sort patients by health score ascending (worst first for table)
    patients.sort((a, b) -> Double.compare(
      ((Number) a.get("healthScore")).doubleValue(),
      ((Number) b.get("healthScore")).doubleValue()));

    result.put("patients", patients);

    // Quadrant summary
    Map<String, Object> quadrants = new LinkedHashMap<>();
    quadrants.put("starPatients", qHighHigh);
    quadrants.put("atRiskChurn", qHighLow);
    quadrants.put("needsPlanChange", qLowHigh);
    quadrants.put("critical", qLowLow);
    result.put("quadrantSummary", quadrants);

    // Overall stats
    Map<String, Object> overall = new LinkedHashMap<>();
    overall.put("totalPatients", profiles.size());
    overall.put("avgHealthScore", profiles.isEmpty() ? 0 : round(totalHealth / profiles.size()));
    overall.put("avgEngagementScore", profiles.isEmpty() ? 0 : round(totalEngage / profiles.size()));
    overall.put("patientsWithEntries", patients.stream()
      .filter(p -> ((Number) p.get("entryCount")).intValue() > 0).count());
    result.put("overallStats", overall);

    // Sort action items by priority
    actionItems.sort((a, b) -> {
      int pa = priorityWeight((String) a.get("priority"));
      int pb = priorityWeight((String) b.get("priority"));
      return Integer.compare(pb, pa);
    });
    result.put("actionItems", actionItems.stream().limit(15).collect(Collectors.toList()));

    return result;
  }

  // ── Health Score Calculation ─────────────────────

  private double computeHealthScore(MedicalProfile profile, BiometricEntry latest, List<BiometricEntry> entries) {
    if (latest == null) return 50; // no data = neutral

    double score = 100;

    // BMI penalty
    double bmi = latest.getBmi() != null ? latest.getBmi() : 25;
    if (bmi > 30) score -= 20;
    else if (bmi > 27) score -= 12;
    else if (bmi > 25) score -= 5;
    else if (bmi < 18.5) score -= 10;

    // Blood pressure penalty
    if (latest.getSystolic() != null) {
      if (latest.getSystolic() > 140) score -= 18;
      else if (latest.getSystolic() > 130) score -= 10;
      else if (latest.getSystolic() > 120) score -= 3;
    }

    // Glucose penalty
    if (latest.getGlucose() != null) {
      if (latest.getGlucose() > 126) score -= 18;
      else if (latest.getGlucose() > 100) score -= 8;
    }

    // Body fat penalty
    if (latest.getBodyFat() != null) {
      if (latest.getBodyFat() > 35) score -= 10;
      else if (latest.getBodyFat() > 28) score -= 5;
    }

    // Condition penalty
    if (profile.getConditions() != null) {
      score -= Math.min(profile.getConditions().size() * 6, 24);
    }

    // Trend penalty (worsening = bad)
    if (entries.size() >= 2) {
      BiometricEntry prev = entries.get(entries.size() - 2);
      double weightDelta = latest.getWeight() - prev.getWeight();
      if (weightDelta > 2) score -= 8;
      else if (weightDelta > 0.5) score -= 3;
      else if (weightDelta < -1) score += 3; // bonus for losing weight

      if (latest.getSystolic() != null && prev.getSystolic() != null) {
        if (latest.getSystolic() - prev.getSystolic() > 10) score -= 6;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // ── Engagement Score Calculation ─────────────────

  private double computeEngagementScore(Long pid, List<BiometricEntry> entries) {
    double score = 0;

    // Entry frequency (max 35 pts)
    int entryCount = entries.size();
    score += Math.min(entryCount * 5, 35);

    // Recency (max 25 pts)
    if (!entries.isEmpty()) {
      long daysSinceLast = ChronoUnit.DAYS.between(
        entries.get(entries.size() - 1).getRecordedAt(), LocalDateTime.now());
      if (daysSinceLast <= 3) score += 25;
      else if (daysSinceLast <= 7) score += 20;
      else if (daysSinceLast <= 14) score += 12;
      else if (daysSinceLast <= 30) score += 5;
    }

    // Goals (max 20 pts)
    List<HealthGoal> goals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid);
    if (!goals.isEmpty()) {
      score += 8; // has goals
      long achieved = goals.stream().filter(g -> g.getAchieved() != null && g.getAchieved()).count();
      score += Math.min(achieved * 4, 12);
    }

    // Consultations (max 20 pts)
    List<Consultation> consults = consultRepo.findAllByProfileIdOrderByScheduledAtDesc(pid);
    if (!consults.isEmpty()) {
      score += 8;
      long completed = consults.stream().filter(c -> "COMPLETED".equals(c.getStatus())).count();
      score += Math.min(completed * 3, 12);
    }

    return Math.max(0, Math.min(100, score));
  }

  // ── Action Item Generation ──────────────────────

  private void generateActionItems(List<Map<String, Object>> items, MedicalProfile profile,
                                   BiometricEntry latest, BiometricEntry previous,
                                   List<BiometricEntry> entries, Long pid,
                                   double healthScore, double engagementScore) {
    String name = (profile.getFirstName() != null ? profile.getFirstName() : "") + " " +
      (profile.getLastName() != null ? profile.getLastName() : "");
    name = name.trim();
    if (name.isEmpty()) name = "Patient #" + pid;

    // Critical health score
    if (healthScore < 35) {
      items.add(actionItem("URGENT", "critical", "🚨",
        "Urgent review needed for " + name,
        "Health score is critically low (" + round(healthScore) + "/100). Schedule immediate consultation.",
        pid, name));
    }

    // Weight spike
    if (latest != null && previous != null) {
      double weightDelta = latest.getWeight() - previous.getWeight();
      if (weightDelta > 3) {
        items.add(actionItem("HIGH", "weight_alert", "⚖️",
          name + " — rapid weight gain detected",
          "+" + round(weightDelta) + " kg since last entry. Investigate dietary adherence.",
          pid, name));
      }
      if (weightDelta < -3) {
        items.add(actionItem("MEDIUM", "weight_alert", "⚖️",
          name + " — rapid weight loss",
          round(Math.abs(weightDelta)) + " kg lost. Verify this is within healthy range.",
          pid, name));
      }
    }

    // Hypertension alert
    if (latest != null && latest.getSystolic() != null && latest.getSystolic() > 140) {
      items.add(actionItem("HIGH", "bp_alert", "❤️",
        name + " — blood pressure elevated",
        "Systolic BP at " + latest.getSystolic() + " mmHg (hypertension range). Consider medication review.",
        pid, name));
    }

    // Glucose alert
    if (latest != null && latest.getGlucose() != null && latest.getGlucose() > 126) {
      items.add(actionItem("HIGH", "glucose_alert", "🩸",
        name + " — glucose in diabetic range",
        "Fasting glucose at " + latest.getGlucose() + " mg/dL. Adjust nutrition plan.",
        pid, name));
    }

    // No entries in 30+ days
    if (!entries.isEmpty()) {
      long daysSince = ChronoUnit.DAYS.between(
        entries.get(entries.size() - 1).getRecordedAt(), LocalDateTime.now());
      if (daysSince > 30) {
        items.add(actionItem("MEDIUM", "inactive", "😴",
          name + " — inactive for " + daysSince + " days",
          "No biometric entries recorded. Send a check-in reminder.",
          pid, name));
      }
    } else {
      items.add(actionItem("LOW", "no_data", "📭",
        name + " — no biometric data",
        "Patient has a profile but no measurements yet. Encourage first entry.",
        pid, name));
    }

    // Low engagement + decent health = churn risk
    if (engagementScore < 30 && healthScore > 60) {
      items.add(actionItem("MEDIUM", "churn_risk", "📉",
        name + " — low engagement, may churn",
        "Health is okay but engagement is very low (" + round(engagementScore) + "/100). Reach out to retain.",
        pid, name));
    }

    // High engagement + low health = plan not working
    if (engagementScore > 60 && healthScore < 40) {
      items.add(actionItem("HIGH", "plan_ineffective", "🔄",
        name + " — engaged but not improving",
        "Patient is active (engagement " + round(engagementScore) + ") but health is declining (" + round(healthScore) + "). Reassess treatment plan.",
        pid, name));
    }

    // Goal achieved — celebrate
    List<HealthGoal> goals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid);
    for (HealthGoal g : goals) {
      if (g.getAchieved() != null && g.getAchieved() && g.getAchievedDate() != null) {
        long daysSinceAchieved = ChronoUnit.DAYS.between(g.getAchievedDate().atStartOfDay(), LocalDateTime.now());
        if (daysSinceAchieved <= 7) {
          items.add(actionItem("LOW", "celebration", "🎉",
            "Congratulate " + name + "!",
            "Achieved " + g.getDirection() + " " + g.getMetric() + " goal (" +
              g.getStartValue() + " → " + g.getTargetValue() + " " + g.getUnit() + ").",
            pid, name));
          break; // one celebration per patient
        }
      }
    }

    // Overdue goals
    long overdueGoals = goals.stream()
      .filter(g -> g.getActive() != null && g.getActive()
        && g.getDeadline() != null && g.getDeadline().isBefore(LocalDate.now()))
      .count();
    if (overdueGoals > 0) {
      items.add(actionItem("MEDIUM", "overdue_goal", "⏰",
        name + " — " + overdueGoals + " overdue goal" + (overdueGoals > 1 ? "s" : ""),
        "Review and either extend deadline or adjust targets.",
        pid, name));
    }

    // Upcoming consultation check
    List<Consultation> consults = consultRepo.findAllByProfileIdOrderByScheduledAtDesc(pid);
    Optional<Consultation> nextConsult = consults.stream()
      .filter(c -> c.getScheduledAt().isAfter(LocalDateTime.now()) && !"CANCELLED".equals(c.getStatus()))
      .min(Comparator.comparing(Consultation::getScheduledAt));
    if (nextConsult.isEmpty() && !consults.isEmpty()) {
      long daysSinceLastConsult = ChronoUnit.DAYS.between(
        consults.get(0).getScheduledAt(), LocalDateTime.now());
      if (daysSinceLastConsult > 45) {
        items.add(actionItem("MEDIUM", "no_upcoming", "📅",
          "Schedule follow-up with " + name,
          "Last consultation was " + daysSinceLastConsult + " days ago. No upcoming appointment.",
          pid, name));
      }
    }
  }

  private Map<String, Object> actionItem(String priority, String type, String icon,
                                         String title, String description, Long profileId, String patientName) {
    Map<String, Object> item = new LinkedHashMap<>();
    item.put("priority", priority);
    item.put("type", type);
    item.put("icon", icon);
    item.put("title", title);
    item.put("description", description);
    item.put("profileId", profileId);
    item.put("patientName", patientName);
    item.put("createdAt", LocalDateTime.now().toString());
    return item;
  }

  private int priorityWeight(String priority) {
    return switch (priority) {
      case "URGENT" -> 4;
      case "HIGH" -> 3;
      case "MEDIUM" -> 2;
      case "LOW" -> 1;
      default -> 0;
    };
  }

  private double round(double v) { return Math.round(v * 10.0) / 10.0; }
}
