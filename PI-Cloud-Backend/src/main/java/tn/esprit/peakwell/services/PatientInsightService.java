package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tn.esprit.peakwell.dto.PatientInsightResponse;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gathers patient features from the DB and calls the Python ML microservice
 * to predict booking probability and dropout type for each patient.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PatientInsightService {

    private final MedicalProfileRepository profileRepo;
    private final BiometricEntryRepository biometricRepo;
    private final ConsultationRepository consultRepo;
    private final SymptomEntryRepository symptomRepo;
    private final HealthGoalRepository goalRepo;
    private final ConsultationRatingRepository ratingRepo;

    private final WebClient mlClient = WebClient.builder()
            .baseUrl("http://localhost:8000")
            .build();

    /**
     * Get insights for all patients of a given dietitian.
     */
    public List<PatientInsightResponse> getInsightsForDietitian(Long dietitianId) {
        List<MedicalProfile> profiles = profileRepo.findByDietitianScope(dietitianId);
        log.info("Found {} patient profiles for dietitian {}", profiles.size(), dietitianId);
        return profiles.stream()
                .map(this::buildInsight)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(PatientInsightResponse::getDropoutConfidence).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Get insight for a single patient.
     */
    public PatientInsightResponse getInsightForPatient(Long profileId) {
        MedicalProfile profile = profileRepo.findById(profileId).orElse(null);
        if (profile == null) return null;
        return buildInsight(profile);
    }

    // ══════════════════════════════════════════════════════════════
    // FEATURE ENGINEERING
    // ══════════════════════════════════════════════════════════════

    private PatientInsightResponse buildInsight(MedicalProfile profile) {
        try {
            Map<String, Object> features = extractFeatures(profile);
            if (features == null) return null;

            // Call ML booking prediction
            Map<String, Object> bookingResult = callMl("/predict/booking", features);
            // Call ML dropout prediction
            Map<String, Object> dropoutResult = callMl("/predict/dropout", features);

            if (bookingResult == null || dropoutResult == null) return null;

            String patientName = buildPatientName(profile);

            return PatientInsightResponse.builder()
                    .profileId(profile.getId())
                    .patientName(patientName)
                    // Booking
                    .willBookSoon((Boolean) bookingResult.getOrDefault("will_book", false))
                    .bookingProbability(toDouble(bookingResult.get("probability")))
                    .bookingConfidence((String) bookingResult.getOrDefault("confidence", "LOW"))
                    // Dropout
                    .dropoutType((String) dropoutResult.getOrDefault("dropout_type", "active"))
                    .dropoutLabel(toInt(dropoutResult.get("dropout_label")))
                    .dropoutConfidence(toDouble(dropoutResult.get("confidence")))
                    .dropoutProbabilities(toDoubleMap(dropoutResult.get("probabilities")))
                    .recommendedAction((String) dropoutResult.getOrDefault("recommended_action", ""))
                    // Context
                    .weightTrend(toDouble(features.get("weight_trend")))
                    .bpSystolicTrend(toDouble(features.get("bp_systolic_trend")))
                    .glucoseTrend(toDouble(features.get("glucose_trend")))
                    .daysSinceLastConsultation(toInt(features.get("days_since_last_consultation")))
                    .avgRating(toDouble(features.get("avg_rating")))
                    .goalProgressPct(toDouble(features.get("goal_progress_pct")))
                    .build();
        } catch (Exception e) {
            log.warn("Failed to build insight for profile {}: {}", profile.getId(), e.getMessage(), e);
            return null;
        }
    }

    private Map<String, Object> extractFeatures(MedicalProfile profile) {
        Long pid = profile.getId();

        // ── Age & Gender ────────────────────────────────────────
        int age = 30; // default
        int gender = 0;
        if (profile.getDateOfBirth() != null) {
            try {
                LocalDate dob = LocalDate.parse(profile.getDateOfBirth());
                age = Period.between(dob, LocalDate.now()).getYears();
            } catch (Exception ignored) {}
        }
        if ("Male".equalsIgnoreCase(profile.getGender()) || "M".equalsIgnoreCase(profile.getGender())) {
            gender = 1;
        }

        // ── Biometric trends (last 3 weeks) ────────────────────
        List<BiometricEntry> entries = biometricRepo.findByProfileIdOrderByRecordedAtAsc(pid);
        double weightTrend = 0, bmiTrend = 0, bpSysTrend = 0, bpDiaTrend = 0;
        double glucoseTrend = 0, bodyFatTrend = 0;
        double weightCurrent = 75, bmiCurrent = 25, bpSysCurrent = 120, glucoseCurrent = 95;
        int bioEntries30d = 0;

        if (entries != null && entries.size() >= 2) {
            LocalDateTime threeWeeksAgo = LocalDateTime.now().minusWeeks(3);
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

            BiometricEntry latest = entries.get(entries.size() - 1);
            weightCurrent = latest.getWeight() != null ? latest.getWeight() : 75;
            bmiCurrent = latest.getBmi() != null ? latest.getBmi() : 25;
            bpSysCurrent = latest.getSystolic() != null ? latest.getSystolic() : 120;
            glucoseCurrent = latest.getGlucose() != null ? latest.getGlucose() : 95;

            // Find entry closest to 3 weeks ago
            BiometricEntry older = entries.stream()
                    .filter(e -> e.getRecordedAt().isBefore(threeWeeksAgo))
                    .reduce((a, b) -> b) // last one before threshold
                    .orElse(entries.get(0));

            weightTrend = safe(latest.getWeight()) - safe(older.getWeight());
            bmiTrend = safe(latest.getBmi()) - safe(older.getBmi());
            bpSysTrend = safeInt(latest.getSystolic()) - safeInt(older.getSystolic());
            bpDiaTrend = safeInt(latest.getDiastolic()) - safeInt(older.getDiastolic());
            glucoseTrend = safe(latest.getGlucose()) - safe(older.getGlucose());
            bodyFatTrend = safe(latest.getBodyFat()) - safe(older.getBodyFat());

            bioEntries30d = (int) entries.stream()
                    .filter(e -> e.getRecordedAt().isAfter(thirtyDaysAgo))
                    .count();
        }

        // ── Consultation history ────────────────────────────────
        List<Consultation> consults = consultRepo.findByProfileIdOrderByScheduledAtDesc(pid);
        int totalConsults = consults != null ? consults.size() : 0;
        if (totalConsults == 0) {
            log.info("Skipping profile {} — no consultation history", profile.getId());
            return null;
        }

        // Use most recent COMPLETED consultation for days_since_last (cancelled ≠ actual visit)
        Optional<Consultation> lastCompleted = consults.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()))
                .filter(c -> c.getScheduledAt().isBefore(LocalDateTime.now()))
                .findFirst(); // already sorted desc
        int daysSinceLast = lastCompleted
                .map(c -> (int) ChronoUnit.DAYS.between(c.getScheduledAt(), LocalDateTime.now()))
                .orElse(0);
        if (daysSinceLast < 0) daysSinceLast = 0;

        // Count both CANCELLED and REJECTED as non-completions (patient/doctor initiated)
        long cancelCount = consults.stream()
                .filter(c -> "CANCELLED".equals(c.getStatus()) || "REJECTED".equals(c.getStatus()))
                .count();
        double cancelRate = totalConsults > 0 ? (double) cancelCount / totalConsults : 0;

        // Average gap between consultations
        double avgGap = 25;
        if (totalConsults >= 2) {
            long totalDays = ChronoUnit.DAYS.between(
                    consults.get(consults.size() - 1).getScheduledAt(),
                    consults.get(0).getScheduledAt());
            avgGap = Math.max(7, (double) totalDays / (totalConsults - 1));
        }

        // ── Satisfaction metrics ────────────────────────────────
        double avgRating = 3.5;
        int symptomsImproved = 1;
        int adviceFollowed = 1;
        int wouldRecommend = 1;

        List<ConsultationRating> ratings = consults.stream()
                .map(Consultation::getRating)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (!ratings.isEmpty()) {
            avgRating = ratings.stream()
                    .mapToInt(ConsultationRating::getOverallRating)
                    .average().orElse(3.5);
            wouldRecommend = ratings.stream()
                    .anyMatch(r -> Boolean.TRUE.equals(r.getWouldRecommend())) ? 1 : 0;
        }

        List<ConsultationFeedback> feedbacks = consults.stream()
                .map(Consultation::getFeedback)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (!feedbacks.isEmpty()) {
            symptomsImproved = feedbacks.stream()
                    .anyMatch(f -> Boolean.TRUE.equals(f.getSymptomsImproved())) ? 1 : 0;
            adviceFollowed = feedbacks.stream()
                    .anyMatch(f -> Boolean.TRUE.equals(f.getAdviceFollowed())) ? 1 : 0;
        }

        // ── Health goals ────────────────────────────────────────
        List<HealthGoal> goals = goalRepo.findByProfileIdOrderByCreatedAtDesc(pid);
        int numActiveGoals = (int) goals.stream().filter(HealthGoal::getActive).count();
        int goalAchieved = goals.stream().anyMatch(HealthGoal::getAchieved) ? 1 : 0;
        double goalProgressPct = 50;
        if (!goals.isEmpty()) {
            goalProgressPct = goals.stream()
                    .filter(HealthGoal::getActive)
                    .mapToDouble(g -> {
                        double range = Math.abs(g.getTargetValue() - g.getStartValue());
                        if (range == 0) return 100;
                        // Get latest biometric for this metric
                        double current = getCurrentMetricValue(entries, g.getMetric(), g.getStartValue());
                        double progress = Math.abs(current - g.getStartValue()) / range * 100;
                        return Math.min(100, progress);
                    })
                    .average().orElse(50);
        }

        // ── Symptoms (last 30 days) ────────────────────────────
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<SymptomEntry> symptoms = symptomRepo
                .findByProfileIdAndLogDateBetweenOrderByLogDateAsc(pid, thirtyDaysAgo, LocalDate.now());
        int symptomCount30d = symptoms != null ? symptoms.size() : 0;
        double avgSeverity = 2.5, avgMood = 3.2, avgEnergy = 3.0, avgStress = 2.8;
        if (symptoms != null && !symptoms.isEmpty()) {
            avgSeverity = symptoms.stream()
                    .filter(s -> s.getSeverity() != null)
                    .mapToInt(SymptomEntry::getSeverity).average().orElse(2.5);
            avgMood = symptoms.stream()
                    .filter(s -> s.getMood() != null)
                    .mapToInt(SymptomEntry::getMood).average().orElse(3.2);
            avgEnergy = symptoms.stream()
                    .filter(s -> s.getEnergyLevel() != null)
                    .mapToInt(SymptomEntry::getEnergyLevel).average().orElse(3.0);
            avgStress = symptoms.stream()
                    .filter(s -> s.getStressLevel() != null)
                    .mapToInt(SymptomEntry::getStressLevel).average().orElse(2.8);
        }

        // ── Build feature map (matches Python FEATURE_ORDER) ───
        Map<String, Object> features = new LinkedHashMap<>();
        features.put("age", age);
        features.put("gender", gender);
        features.put("weight_trend", round2(weightTrend));
        features.put("bmi_trend", round2(bmiTrend));
        features.put("bp_systolic_trend", round2(bpSysTrend));
        features.put("bp_diastolic_trend", round2(bpDiaTrend));
        features.put("glucose_trend", round2(glucoseTrend));
        features.put("body_fat_trend", round2(bodyFatTrend));
        features.put("weight_current", round2(weightCurrent));
        features.put("bmi_current", round2(bmiCurrent));
        features.put("bp_systolic_current", round2(bpSysCurrent));
        features.put("glucose_current", round2(glucoseCurrent));
        features.put("days_since_last_consultation", daysSinceLast);
        features.put("total_consultations", totalConsults);
        features.put("cancel_rate", round2(cancelRate));
        features.put("avg_consultation_gap_days", round2(avgGap));
        features.put("avg_rating", round2(avgRating));
        features.put("symptoms_improved", symptomsImproved);
        features.put("advice_followed", adviceFollowed);
        features.put("would_recommend", wouldRecommend);
        features.put("goal_progress_pct", round2(goalProgressPct));
        features.put("goal_achieved", goalAchieved);
        features.put("num_active_goals", numActiveGoals);
        features.put("symptom_count_30d", symptomCount30d);
        features.put("avg_symptom_severity", round2(avgSeverity));
        features.put("avg_mood", round2(avgMood));
        features.put("avg_energy", round2(avgEnergy));
        features.put("avg_stress", round2(avgStress));
        features.put("biometric_entries_last_30d", bioEntries30d);

        return features;
    }

    // ══════════════════════════════════════════════════════════════
    // ML CLIENT
    // ══════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private Map<String, Object> callMl(String path, Map<String, Object> features) {
        try {
            return mlClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(features)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("ML service call failed ({}): {}", path, e.getMessage());
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════

    private String buildPatientName(MedicalProfile p) {
        String fn = p.getFirstName() != null ? p.getFirstName() : "";
        String ln = p.getLastName() != null ? p.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return name.isEmpty() ? "Patient #" + p.getId() : name;
    }

    private double safe(Double v) { return v != null ? v : 0; }
    private double safeInt(Integer v) { return v != null ? v : 0; }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    private double getCurrentMetricValue(List<BiometricEntry> entries, String metric, double fallback) {
        if (entries == null || entries.isEmpty()) return fallback;
        BiometricEntry latest = entries.get(entries.size() - 1);
        return switch (metric.toLowerCase()) {
            case "weight" -> safe(latest.getWeight());
            case "bmi" -> safe(latest.getBmi());
            case "bodyfat", "body_fat" -> safe(latest.getBodyFat());
            case "systolic" -> safeInt(latest.getSystolic());
            case "glucose" -> safe(latest.getGlucose());
            default -> fallback;
        };
    }

    private double toDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        return 0;
    }

    private int toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        return 0;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> toDoubleMap(Object o) {
        if (o instanceof Map<?, ?> raw) {
            Map<String, Double> result = new LinkedHashMap<>();
            raw.forEach((k, v) -> result.put(String.valueOf(k), toDouble(v)));
            return result;
        }
        return Map.of("active", 0.0, "discouraged", 0.0, "healed", 0.0);
    }
}
