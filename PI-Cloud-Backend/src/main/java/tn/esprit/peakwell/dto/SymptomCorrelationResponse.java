package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCorrelationResponse {

  private List<SymptomFrequency> topSymptoms;
  private List<Correlation> correlations;
  private List<PatternInsight> patterns;
  private OverallSummary summary;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SymptomFrequency {
    private String symptom;
    private int count;
    private double avgSeverity;
    private String mostCommonTime;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Correlation {
    private String symptom;
    private String biometric;
    private String relationship;    // "positive", "negative", "none"
    private double strength;        // 0.0 - 1.0
    private String description;     // human-readable insight
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PatternInsight {
    private String type;            // "trigger", "timing", "trend", "biometric"
    private String icon;
    private String title;
    private String description;
    private String severity;        // "info", "warning", "critical"
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OverallSummary {
    private int totalEntries;
    private int uniqueSymptoms;
    private int correlationsFound;
    private double avgMood;
    private double avgEnergy;
    private double avgStress;
    private String mostFrequentSymptom;
    private String peakSymptomTime;
  }
}
