package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationResponse {
  private Long id;
  private String scheduledAt;
  private Integer durationMinutes;
  private String status;
  private String doctorName;
  private String doctorSpecialty;
  private String consultationType;
  private String reason;
  private String priority;

  private String doctorNotes;
  private String diagnosis;
  private String prescription;
  private String followUpInstructions;
  private String followUpDate;

  private Map<String, Object> biometricSnapshot;
  private List<Map<String, Object>> goalSnapshot;
  private String aiSummary;
  private Map<String, Object> feedback;
  private Map<String, Object> rating;


  private String rejectionReason;
  private String patientName;
  private String patientImageUrl;
  private Boolean reminder24hSent;
  private Boolean reminder1hSent;
  private String createdAt;
  private String completedAt;

}