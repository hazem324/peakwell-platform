package tn.esprit.peakwell.services;

import tn.esprit.peakwell.dto.TimelineEvent;
import tn.esprit.peakwell.dto.TimelineResponse;
import tn.esprit.peakwell.entities.BiometricEntry;
import tn.esprit.peakwell.entities.HealthGoal;
import tn.esprit.peakwell.entities.GoalMilestone;
import tn.esprit.peakwell.entities.SymptomEntry;
import tn.esprit.peakwell.repositories.BiometricEntryRepository;
import tn.esprit.peakwell.repositories.HealthGoalRepository;
import tn.esprit.peakwell.repositories.SymptomEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelineService {

  private final BiometricEntryRepository biometricRepo;
  private final SymptomEntryRepository symptomRepo;
  private final HealthGoalRepository goalRepo;

  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy");
  private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");

  public TimelineResponse getTimeline(String filter, String startDate, String endDate) {
    List<TimelineEvent> events = new ArrayList<>();

    boolean all = filter == null || filter.equals("all");

    // ── Biometric entries ────────────────────────
    if (all || filter.equals("biometric")) {
      List<BiometricEntry> entries = biometricRepo.findAllByOrderByRecordedAtAsc();
      BiometricEntry prev = null;
      for (BiometricEntry entry : entries) {
        events.add(buildBiometricEvent(entry, prev));
        // Generate alerts from biometrics
        if (all || filter.equals("alert")) {
          events.addAll(buildAlertEvents(entry));
        }
        prev = entry;
      }
    }

    // ── Symptom entries ──────────────────────────
    if (all || filter.equals("symptom")) {
      List<SymptomEntry> symptoms = symptomRepo.findAllByOrderByLogDateDesc();
      for (SymptomEntry s : symptoms) {
        events.add(buildSymptomEvent(s));
      }
    }

    // ── Health goals + milestones ────────────────
    if (all || filter.equals("goal")) {
      List<HealthGoal> goals = goalRepo.findAllByOrderByCreatedAtDesc();
      for (HealthGoal goal : goals) {
        events.add(buildGoalEvent(goal));
        // Add milestones that have been reached
        if (goal.getMilestones() != null) {
          for (GoalMilestone m : goal.getMilestones()) {
            if (m.getReached() && m.getReachedDate() != null) {
              events.add(buildMilestoneEvent(goal, m));
            }
          }
        }
      }
    }

    // ── Filter by date range ────────────────────
    if (startDate != null && endDate != null) {
      LocalDate start = LocalDate.parse(startDate);
      LocalDate end = LocalDate.parse(endDate);
      events = events.stream()
        .filter(e -> {
          LocalDate d = LocalDate.parse(e.getDate().substring(0, 10));
          return !d.isBefore(start) && !d.isAfter(end);
        })
        .collect(Collectors.toList());
    }

    // ── Sort by date descending ─────────────────
    events.sort((a, b) -> b.getDate().compareTo(a.getDate()));

    // ── Summary stats ───────────────────────────
    Map<String, Integer> counts = new LinkedHashMap<>();
    counts.put("biometric", (int) events.stream().filter(e -> "biometric".equals(e.getType())).count());
    counts.put("symptom", (int) events.stream().filter(e -> "symptom".equals(e.getType())).count());
    counts.put("goal", (int) events.stream().filter(e -> "goal".equals(e.getType())).count());
    counts.put("milestone", (int) events.stream().filter(e -> "milestone".equals(e.getType())).count());
    counts.put("alert", (int) events.stream().filter(e -> "alert".equals(e.getType())).count());

    String dateRange = "";
    if (!events.isEmpty()) {
      String first = events.get(events.size() - 1).getDate().substring(0, 10);
      String last = events.get(0).getDate().substring(0, 10);
      dateRange = LocalDate.parse(first).format(DATE_FMT) + " — " + LocalDate.parse(last).format(DATE_FMT);
    }

    return TimelineResponse.builder()
      .events(events)
      .totalEvents(events.size())
      .eventCounts(counts)
      .dateRange(dateRange)
      .build();
  }

  // ── Biometric Event Builder ─────────────────────

  private TimelineEvent buildBiometricEvent(BiometricEntry entry, BiometricEntry prev) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("weight", entry.getWeight());
    data.put("bmi", entry.getBmi());
    if (entry.getBodyFat() != null) data.put("bodyFat", entry.getBodyFat());
    if (entry.getMuscleMass() != null) data.put("muscleMass", entry.getMuscleMass());
    if (entry.getSystolic() != null) data.put("systolic", entry.getSystolic());
    if (entry.getDiastolic() != null) data.put("diastolic", entry.getDiastolic());
    if (entry.getGlucose() != null) data.put("glucose", entry.getGlucose());

    // Calculate changes from previous
    if (prev != null) {
      double weightChange = Math.round((entry.getWeight() - prev.getWeight()) * 10.0) / 10.0;
      double bmiChange = Math.round((entry.getBmi() - prev.getBmi()) * 10.0) / 10.0;
      data.put("weightChange", weightChange);
      data.put("bmiChange", bmiChange);
    }

    String subtitle = entry.getWeight() + "kg · BMI " + entry.getBmi();
    if (entry.getSystolic() != null) subtitle += " · BP " + entry.getSystolic() + "/" + entry.getDiastolic();

    return TimelineEvent.builder()
      .id("bio-" + entry.getId())
      .date(entry.getRecordedAt().toString())
      .type("biometric")
      .title("Biometric Measurement")
      .subtitle(subtitle)
      .icon("📊")
      .color("#4ab8f0")
      .severity("info")
      .data(data)
      .build();
  }

  // ── Alert Event Builder ─────────────────────────

  private List<TimelineEvent> buildAlertEvents(BiometricEntry entry) {
    List<TimelineEvent> alerts = new ArrayList<>();
    String date = entry.getRecordedAt().toString();

    if (entry.getBmi() > 30) {
      alerts.add(TimelineEvent.builder()
        .id("alert-bmi-" + entry.getId())
        .date(date).type("alert")
        .title("Obesity Alert")
        .subtitle("BMI " + entry.getBmi() + " — obese range")
        .icon("🔴").color("#c96a3f").severity("danger")
        .data(Map.of("metric", "bmi", "value", entry.getBmi(), "threshold", 30))
        .build());
    } else if (entry.getBmi() > 25) {
      alerts.add(TimelineEvent.builder()
        .id("alert-bmi-" + entry.getId())
        .date(date).type("alert")
        .title("Overweight Notice")
        .subtitle("BMI " + entry.getBmi() + " — overweight range")
        .icon("🟡").color("#e88f68").severity("warning")
        .data(Map.of("metric", "bmi", "value", entry.getBmi(), "threshold", 25))
        .build());
    }

    if (entry.getSystolic() != null && entry.getSystolic() > 140) {
      alerts.add(TimelineEvent.builder()
        .id("alert-bp-" + entry.getId())
        .date(date).type("alert")
        .title("High Blood Pressure")
        .subtitle("Systolic " + entry.getSystolic() + " mmHg — hypertension range")
        .icon("❤️").color("#c96a3f").severity("danger")
        .data(Map.of("metric", "systolic", "value", entry.getSystolic(), "threshold", 140))
        .build());
    }

    if (entry.getGlucose() != null && entry.getGlucose() > 126) {
      alerts.add(TimelineEvent.builder()
        .id("alert-gluc-" + entry.getId())
        .date(date).type("alert")
        .title("Diabetic Glucose Level")
        .subtitle("Glucose " + entry.getGlucose() + " mg/dL — diabetic range")
        .icon("🩸").color("#c96a3f").severity("danger")
        .data(Map.of("metric", "glucose", "value", entry.getGlucose(), "threshold", 126))
        .build());
    } else if (entry.getGlucose() != null && entry.getGlucose() > 100) {
      alerts.add(TimelineEvent.builder()
        .id("alert-gluc-" + entry.getId())
        .date(date).type("alert")
        .title("Pre-diabetic Glucose")
        .subtitle("Glucose " + entry.getGlucose() + " mg/dL — pre-diabetic")
        .icon("🩸").color("#e88f68").severity("warning")
        .data(Map.of("metric", "glucose", "value", entry.getGlucose(), "threshold", 100))
        .build());
    }

    return alerts;
  }

  // ── Symptom Event Builder ───────────────────────

  private TimelineEvent buildSymptomEvent(SymptomEntry entry) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("severity", entry.getSeverity());
    data.put("mood", entry.getMood());
    data.put("energy", entry.getEnergyLevel());
    data.put("stressLevel", entry.getStressLevel());
    if (entry.getTimeOfDay() != null) data.put("timeOfDay", entry.getTimeOfDay());
    if (entry.getNotes() != null) data.put("notes", entry.getNotes());

    String sevLabel;
    String color;
    String severity;
    int sev = entry.getSeverity();
    if (sev <= 2) { sevLabel = "Mild"; color = "#7a9e7e"; severity = "info"; }
    else if (sev <= 4) { sevLabel = "Moderate"; color = "#e88f68"; severity = "warning"; }
    else if (sev <= 6) { sevLabel = "Significant"; color = "#c96a3f"; severity = "warning"; }
    else { sevLabel = "Severe"; color = "#a8532c"; severity = "danger"; }

    return TimelineEvent.builder()
      .id("sym-" + entry.getId())
      .date(entry.getLogDate().atStartOfDay().toString())
      .type("symptom")
      .title(entry.getSymptom())
      .subtitle("Severity " + sev + "/10 · " + sevLabel)
      .icon("🩺")
      .color(color)
      .severity(severity)
      .data(data)
      .build();
  }

  // ── Goal Event Builder ──────────────────────────

  private TimelineEvent buildGoalEvent(HealthGoal goal) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("metric", goal.getMetric());
    data.put("direction", goal.getDirection());
    data.put("startValue", goal.getStartValue());
    data.put("targetValue", goal.getTargetValue());
    data.put("unit", goal.getUnit());
    data.put("deadline", goal.getDeadline().toString());
    data.put("achieved", goal.getAchieved());

    String subtitle = goal.getDirection() + " " + goal.getMetric() + ": " +
      goal.getStartValue() + " → " + goal.getTargetValue() + " " + goal.getUnit();

    return TimelineEvent.builder()
      .id("goal-" + goal.getId())
      .date(goal.getCreatedAt().toString())
      .type("goal")
      .title("Goal Created: " + goal.getMetric())
      .subtitle(subtitle)
      .icon("🎯")
      .color(goal.getAchieved() ? "#7a9e7e" : "#4ab8f0")
      .severity(goal.getAchieved() ? "success" : "info")
      .data(data)
      .build();
  }

  // ── Milestone Event Builder ─────────────────────

  private TimelineEvent buildMilestoneEvent(HealthGoal goal, GoalMilestone milestone) {
    return TimelineEvent.builder()
      .id("ms-" + milestone.getId())
      .date(LocalDate.now().atStartOfDay().toString()) // approximate
      .type("milestone")
      .title("Milestone Reached!")
      .subtitle(milestone.getLabel() + " — " + goal.getMetric() + " at " + milestone.getTargetValue() + " " + goal.getUnit())
      .icon("🏆")
      .color("#7a9e7e")
      .severity("success")
      .data(Map.of("goalMetric", goal.getMetric(), "milestoneValue", milestone.getTargetValue()))
      .build();
  }
}
