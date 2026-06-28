package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.SymptomCorrelationResponse;
import tn.esprit.peakwell.dto.SymptomCorrelationResponse.Correlation;
import tn.esprit.peakwell.dto.SymptomCorrelationResponse.OverallSummary;
import tn.esprit.peakwell.dto.SymptomCorrelationResponse.PatternInsight;
import tn.esprit.peakwell.dto.SymptomCorrelationResponse.SymptomFrequency;
import tn.esprit.peakwell.dto.SymptomEntryRequest;
import tn.esprit.peakwell.dto.SymptomEntryResponse;
import tn.esprit.peakwell.entities.BiometricEntry;
import tn.esprit.peakwell.entities.MedicalProfile;
import tn.esprit.peakwell.entities.SymptomEntry;
import tn.esprit.peakwell.repositories.BiometricEntryRepository;
import tn.esprit.peakwell.repositories.MedicalProfileRepository;
import tn.esprit.peakwell.repositories.SymptomEntryRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SymptomService {

  private final SymptomEntryRepository symptomRepo;
  private final BiometricEntryRepository biometricRepo;
  private final MedicalProfileRepository profileRepository;

  // ── CRUD ────────────────────────────────────────

  public List<SymptomEntryResponse> getAll() {
    return symptomRepo.findAllByOrderByLogDateDesc()
            .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<SymptomEntryResponse> getByDate(String date) {
    return symptomRepo.findByLogDateOrderByCreatedAtDesc(LocalDate.parse(date))
            .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<SymptomEntryResponse> getByRange(String start, String end) {
    return symptomRepo.findByLogDateBetweenOrderByLogDateAsc(
            LocalDate.parse(start), LocalDate.parse(end)
    ).stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<SymptomEntryResponse> getBySymptom(String symptom) {
    return symptomRepo.findBySymptomIgnoreCaseOrderByLogDateDesc(symptom)
            .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<String> getDistinctSymptoms() {
    return symptomRepo.findDistinctSymptoms();
  }

  public SymptomEntryResponse addEntry(SymptomEntryRequest request) {
    MedicalProfile profile = profileRepository.findById(1L)
            .orElseThrow(() -> new RuntimeException("Medical profile not found. Please create your profile first."));
    SymptomEntry entry = SymptomEntry.builder()
            .logDate(LocalDate.parse(request.getLogDate()))
            .symptom(request.getSymptom())
            .severity(request.getSeverity())
            .timeOfDay(request.getTimeOfDay())
            .duration(request.getDuration())
            .notes(request.getNotes())
            .mood(request.getMood())
            .profile(profile)
            .energyLevel(request.getEnergyLevel())
            .stressLevel(request.getStressLevel())
            .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
            .triggers(request.getTriggers() != null ? request.getTriggers() : new ArrayList<>())
            .build();
    return toResponse(symptomRepo.save(entry));
  }

  public SymptomEntryResponse updateEntry(Long id, SymptomEntryRequest request) {
    SymptomEntry entry = symptomRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Symptom entry not found"));


    if (request.getSymptom() != null) entry.setSymptom(request.getSymptom());
    if (request.getSeverity() != null) entry.setSeverity(request.getSeverity());
    if (request.getTimeOfDay() != null) entry.setTimeOfDay(request.getTimeOfDay());
    if (request.getDuration() != null) entry.setDuration(request.getDuration());
    if (request.getNotes() != null) entry.setNotes(request.getNotes());
    if (request.getMood() != null) entry.setMood(request.getMood());
    if (request.getEnergyLevel() != null) entry.setEnergyLevel(request.getEnergyLevel());
    if (request.getStressLevel() != null) entry.setStressLevel(request.getStressLevel());
    if (request.getTags() != null) entry.setTags(request.getTags());
    if (request.getTriggers() != null) entry.setTriggers(request.getTriggers());

    return toResponse(symptomRepo.save(entry));
  }

  public void deleteEntry(Long id) {
    symptomRepo.deleteById(id);
  }

  // ── CORRELATION ENGINE ──────────────────────────

  public SymptomCorrelationResponse analyzeCorrelations() {
    List<SymptomEntry> symptoms = symptomRepo.findTop30ByOrderByLogDateDesc();
    List<BiometricEntry> biometrics = biometricRepo.findAllByOrderByRecordedAtAsc();


    if (symptoms.isEmpty()) {
      return SymptomCorrelationResponse.builder()
              .topSymptoms(List.of())
              .correlations(List.of())
              .patterns(List.of())
              .summary(OverallSummary.builder().totalEntries(0).uniqueSymptoms(0).build())
              .build();
    }

    List<SymptomFrequency> topSymptoms = computeTopSymptoms(symptoms);
    List<Correlation> correlations = computeCorrelations(symptoms, biometrics);
    List<PatternInsight> patterns = detectPatterns(symptoms, biometrics, correlations);
    OverallSummary summary = buildSummary(symptoms, topSymptoms, correlations);

    return SymptomCorrelationResponse.builder()
            .topSymptoms(topSymptoms)
            .correlations(correlations)
            .patterns(patterns)
            .summary(summary)
            .build();
  }

  // ── Top Symptoms ────────────────────────────────

  private List<SymptomFrequency> computeTopSymptoms(List<SymptomEntry> symptoms) {
    Map<String, List<SymptomEntry>> grouped = symptoms.stream()
            .collect(Collectors.groupingBy(SymptomEntry::getSymptom));

    return grouped.entrySet().stream()
            .map(e -> {
              List<SymptomEntry> entries = e.getValue();
              double avgSev = entries.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0);

              // Find most common time of day
              String mostCommonTime = entries.stream()
                      .filter(s -> s.getTimeOfDay() != null)
                      .collect(Collectors.groupingBy(SymptomEntry::getTimeOfDay, Collectors.counting()))
                      .entrySet().stream()
                      .max(Map.Entry.comparingByValue())
                      .map(Map.Entry::getKey)
                      .orElse("unknown");

              return SymptomFrequency.builder()
                      .symptom(e.getKey())
                      .count(entries.size())
                      .avgSeverity(Math.round(avgSev * 10.0) / 10.0)
                      .mostCommonTime(mostCommonTime)
                      .build();
            })
            .sorted((a, b) -> Integer.compare(b.getCount(), a.getCount()))
            .limit(10)
            .collect(Collectors.toList());
  }

  // ── Biometric Correlations ──────────────────────

  private List<Correlation> computeCorrelations(List<SymptomEntry> symptoms, List<BiometricEntry> biometrics) {
    List<Correlation> correlations = new ArrayList<>();
    if (biometrics.isEmpty() || symptoms.isEmpty()) return correlations;

    // Group symptoms by type
    Map<String, List<SymptomEntry>> symptomGroups = symptoms.stream()
            .collect(Collectors.groupingBy(SymptomEntry::getSymptom));

    // Build a date→biometric map (use closest biometric reading)
    Map<LocalDate, BiometricEntry> bioByDate = new HashMap<>();
    for (BiometricEntry b : biometrics) {
      bioByDate.put(b.getRecordedAt().toLocalDate(), b);
    }

    for (Map.Entry<String, List<SymptomEntry>> entry : symptomGroups.entrySet()) {
      String symptomName = entry.getKey();
      List<SymptomEntry> symptomList = entry.getValue();
      if (symptomList.size() < 2) continue;

      // Correlate with weight
      correlateWithMetric(correlations, symptomName, symptomList, bioByDate,
              "Weight", "kg", BiometricEntry::getWeight, false);

      // Correlate with BMI
      correlateWithMetric(correlations, symptomName, symptomList, bioByDate,
              "BMI", "", BiometricEntry::getBmi, false);

      // Correlate with systolic BP
      correlateWithMetricInt(correlations, symptomName, symptomList, bioByDate,
              "Blood Pressure", "mmHg", BiometricEntry::getSystolic, false);

      // Correlate with glucose
      correlateWithMetric(correlations, symptomName, symptomList, bioByDate,
              "Glucose", "mg/dL", BiometricEntry::getGlucose, false);
    }

    return correlations;
  }

  private void correlateWithMetric(List<Correlation> correlations, String symptomName,
                                   List<SymptomEntry> symptoms, Map<LocalDate, BiometricEntry> bioByDate,
                                   String metricName, String unit,
                                   java.util.function.Function<BiometricEntry, Double> extractor,
                                   boolean higherIsBetter) {
    List<double[]> pairs = new ArrayList<>(); // [severity, metricValue]

    for (SymptomEntry s : symptoms) {
      BiometricEntry bio = findClosestBiometric(s.getLogDate(), bioByDate);
      if (bio != null) {
        Double val = extractor.apply(bio);
        if (val != null) {
          pairs.add(new double[]{s.getSeverity(), val});
        }
      }
    }

    if (pairs.size() < 2) return;

    double correlation = computePearson(pairs);
    if (Math.abs(correlation) < 0.2) return; // Too weak

    String relationship = correlation > 0 ? "positive" : "negative";
    String desc = buildCorrelationDescription(symptomName, metricName, unit, correlation, relationship);

    correlations.add(Correlation.builder()
            .symptom(symptomName)
            .biometric(metricName)
            .relationship(relationship)
            .strength(Math.round(Math.abs(correlation) * 100.0) / 100.0)
            .description(desc)
            .build());
  }

  private void correlateWithMetricInt(List<Correlation> correlations, String symptomName,
                                      List<SymptomEntry> symptoms, Map<LocalDate, BiometricEntry> bioByDate,
                                      String metricName, String unit,
                                      java.util.function.Function<BiometricEntry, Integer> extractor,
                                      boolean higherIsBetter) {
    correlateWithMetric(correlations, symptomName, symptoms, bioByDate,
            metricName, unit,
            bio -> {
              Integer val = extractor.apply(bio);
              return val != null ? val.doubleValue() : null;
            },
            higherIsBetter);
  }

  private BiometricEntry findClosestBiometric(LocalDate date, Map<LocalDate, BiometricEntry> bioByDate) {
    // Exact match first
    if (bioByDate.containsKey(date)) return bioByDate.get(date);
    // Search within ±7 days
    for (int offset = 1; offset <= 7; offset++) {
      if (bioByDate.containsKey(date.minusDays(offset))) return bioByDate.get(date.minusDays(offset));
      if (bioByDate.containsKey(date.plusDays(offset))) return bioByDate.get(date.plusDays(offset));
    }
    return null;
  }

  private double computePearson(List<double[]> pairs) {
    int n = pairs.size();
    if (n < 2) return 0;

    double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (double[] p : pairs) {
      sumX += p[0]; sumY += p[1];
      sumXY += p[0] * p[1];
      sumX2 += p[0] * p[0]; sumY2 += p[1] * p[1];
    }

    double denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denom == 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  }

  private String buildCorrelationDescription(String symptom, String metric, String unit,
                                             double correlation, String relationship) {
    String strength = Math.abs(correlation) > 0.7 ? "strong" :
            Math.abs(correlation) > 0.4 ? "moderate" : "mild";

    if ("positive".equals(relationship)) {
      return String.format("%s severity tends to increase when %s is higher — %s correlation (r=%.2f)",
              symptom, metric, strength, correlation);
    } else {
      return String.format("%s severity tends to increase when %s is lower — %s inverse correlation (r=%.2f)",
              symptom, metric, strength, correlation);
    }
  }

  // ── Pattern Detection ───────────────────────────

  private List<PatternInsight> detectPatterns(List<SymptomEntry> symptoms,
                                              List<BiometricEntry> biometrics,
                                              List<Correlation> correlations) {
    List<PatternInsight> patterns = new ArrayList<>();

    // 1. Time-of-day pattern
    Map<String, Long> timeCount = symptoms.stream()
            .filter(s -> s.getTimeOfDay() != null)
            .collect(Collectors.groupingBy(SymptomEntry::getTimeOfDay, Collectors.counting()));

    String peakTime = timeCount.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey).orElse(null);

    if (peakTime != null && timeCount.getOrDefault(peakTime, 0L) >= 3) {
      patterns.add(PatternInsight.builder()
              .type("timing").icon("🕐")
              .title("Symptoms peak in the " + peakTime)
              .description(String.format("%d of your %d logged symptoms occur in the %s. Consider adjusting your routine during this time.",
                      timeCount.get(peakTime), symptoms.size(), peakTime))
              .severity("info")
              .build());
    }

    // 2. Trigger patterns
    Map<String, Long> triggerCount = symptoms.stream()
            .flatMap(s -> s.getTriggers().stream())
            .collect(Collectors.groupingBy(t -> t, Collectors.counting()));

    triggerCount.entrySet().stream()
            .filter(e -> e.getValue() >= 2)
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(3)
            .forEach(e -> {
              patterns.add(PatternInsight.builder()
                      .type("trigger").icon("⚡")
                      .title("Recurring trigger: " + e.getKey().replace("_", " "))
                      .description(String.format("'%s' appears as a trigger in %d symptom entries. Try to minimize exposure.",
                              e.getKey().replace("_", " "), e.getValue()))
                      .severity("warning")
                      .build());
            });

    // 3. Stress-symptom pattern
    List<SymptomEntry> highStress = symptoms.stream()
            .filter(s -> s.getStressLevel() != null && s.getStressLevel() >= 4)
            .collect(Collectors.toList());

    if (highStress.size() >= 3) {
      double avgSevHighStress = highStress.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0);
      double avgSevLowStress = symptoms.stream()
              .filter(s -> s.getStressLevel() != null && s.getStressLevel() <= 2)
              .mapToInt(SymptomEntry::getSeverity).average().orElse(0);

      if (avgSevHighStress > avgSevLowStress + 0.5) {
        patterns.add(PatternInsight.builder()
                .type("trend").icon("😰")
                .title("Stress amplifies your symptoms")
                .description(String.format("When stress is high (4-5), your average symptom severity is %.1f vs %.1f on low-stress days. Stress management could reduce symptoms.",
                        avgSevHighStress, avgSevLowStress))
                .severity("warning")
                .build());
      }
    }

    // 4. Low mood correlation
    List<SymptomEntry> lowMood = symptoms.stream()
            .filter(s -> s.getMood() != null && s.getMood() <= 2)
            .collect(Collectors.toList());

    if (lowMood.size() >= 3) {
      double avgSevLowMood = lowMood.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0);
      if (avgSevLowMood >= 3) {
        patterns.add(PatternInsight.builder()
                .type("trend").icon("😔")
                .title("Low mood days correlate with severe symptoms")
                .description(String.format("On days you rate mood 1-2, average symptom severity is %.1f (moderate-severe). Your emotional state may be connected to physical symptoms.",
                        avgSevLowMood))
                .severity("info")
                .build());
      }
    }

    // 5. Biometric-based patterns from correlations
    for (Correlation c : correlations) {
      if (c.getStrength() >= 0.5) {
        patterns.add(PatternInsight.builder()
                .type("biometric").icon("📊")
                .title(c.getSymptom() + " linked to " + c.getBiometric())
                .description(c.getDescription())
                .severity(c.getStrength() >= 0.7 ? "critical" : "warning")
                .build());
      }
    }

    // 6. Severity escalation pattern
    if (symptoms.size() >= 5) {
      List<SymptomEntry> sorted = symptoms.stream()
              .sorted(Comparator.comparing(SymptomEntry::getLogDate))
              .collect(Collectors.toList());
      List<SymptomEntry> recent = sorted.subList(Math.max(0, sorted.size() - 5), sorted.size());
      List<SymptomEntry> earlier = sorted.subList(0, Math.min(5, sorted.size()));

      double recentAvg = recent.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0);
      double earlierAvg = earlier.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0);

      if (recentAvg > earlierAvg + 0.8) {
        patterns.add(PatternInsight.builder()
                .type("trend").icon("📈")
                .title("Symptom severity is increasing over time")
                .description(String.format("Your recent average severity (%.1f) is higher than earlier entries (%.1f). Consider consulting your doctor if this trend continues.",
                        recentAvg, earlierAvg))
                .severity("critical")
                .build());
      } else if (recentAvg < earlierAvg - 0.8) {
        patterns.add(PatternInsight.builder()
                .type("trend").icon("📉")
                .title("Symptoms are improving over time")
                .description(String.format("Your recent average severity (%.1f) is lower than earlier entries (%.1f). Your management approach seems to be working.",
                        recentAvg, earlierAvg))
                .severity("info")
                .build());
      }
    }

    return patterns;
  }

  // ── Summary ─────────────────────────────────────

  private OverallSummary buildSummary(List<SymptomEntry> symptoms,
                                      List<SymptomFrequency> topSymptoms,
                                      List<Correlation> correlations) {
    int uniqueSymptoms = (int) symptoms.stream().map(SymptomEntry::getSymptom).distinct().count();
    double avgMood = symptoms.stream().filter(s -> s.getMood() != null).mapToInt(SymptomEntry::getMood).average().orElse(0);
    double avgEnergy = symptoms.stream().filter(s -> s.getEnergyLevel() != null).mapToInt(SymptomEntry::getEnergyLevel).average().orElse(0);
    double avgStress = symptoms.stream().filter(s -> s.getStressLevel() != null).mapToInt(SymptomEntry::getStressLevel).average().orElse(0);

    String mostFrequent = topSymptoms.isEmpty() ? "None" : topSymptoms.get(0).getSymptom();

    String peakTime = symptoms.stream()
            .filter(s -> s.getTimeOfDay() != null)
            .collect(Collectors.groupingBy(SymptomEntry::getTimeOfDay, Collectors.counting()))
            .entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey).orElse("unknown");

    return OverallSummary.builder()
            .totalEntries(symptoms.size())
            .uniqueSymptoms(uniqueSymptoms)
            .correlationsFound(correlations.size())
            .avgMood(Math.round(avgMood * 10.0) / 10.0)
            .avgEnergy(Math.round(avgEnergy * 10.0) / 10.0)
            .avgStress(Math.round(avgStress * 10.0) / 10.0)
            .mostFrequentSymptom(mostFrequent)
            .peakSymptomTime(peakTime)
            .build();
  }

  // ── Mapper ──────────────────────────────────────

  private SymptomEntryResponse toResponse(SymptomEntry entry) {
    SymptomEntryResponse res = new SymptomEntryResponse();
    res.setId(entry.getId());
    res.setLogDate(entry.getLogDate().toString());
    res.setSymptom(entry.getSymptom());
    res.setSeverity(entry.getSeverity());
    res.setTimeOfDay(entry.getTimeOfDay());
    res.setDuration(entry.getDuration());
    res.setNotes(entry.getNotes());
    res.setMood(entry.getMood());
    res.setEnergyLevel(entry.getEnergyLevel());
    res.setStressLevel(entry.getStressLevel());
    res.setTags(entry.getTags());
    res.setTriggers(entry.getTriggers());
    res.setCreatedAt(entry.getCreatedAt() != null ? entry.getCreatedAt().toString() : null);
    return res;
  }
}