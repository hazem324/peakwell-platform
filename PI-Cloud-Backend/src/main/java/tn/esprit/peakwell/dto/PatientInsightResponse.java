package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientInsightResponse {

    private Long profileId;
    private String patientName;

    // ── Booking prediction ──────────────────────────────────────
    private boolean willBookSoon;
    private double bookingProbability;     // 0-100
    private String bookingConfidence;      // LOW / MEDIUM / HIGH

    // ── Dropout classification ──────────────────────────────────
    private String dropoutType;            // active / discouraged / healed
    private int dropoutLabel;              // 0 / 1 / 2
    private double dropoutConfidence;      // 0-100
    private Map<String, Double> dropoutProbabilities; // {active, discouraged, healed}
    private String recommendedAction;

    // ── Key biometric context ───────────────────────────────────
    private double weightTrend;
    private double bpSystolicTrend;
    private double glucoseTrend;
    private int daysSinceLastConsultation;
    private double avgRating;
    private double goalProgressPct;
}
