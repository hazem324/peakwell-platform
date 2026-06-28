package tn.esprit.peakwell.dto;

import lombok.Data;

@Data
public class ConsultationRequest {
  // Booking fields
  private Long dietitianId;
  private String scheduledAt;         // "2026-03-25T10:30:00"
  private Integer durationMinutes;
  private String doctorName;
  private String doctorSpecialty;
  private String consultationType;    // IN_PERSON, VIDEO_CALL, PHONE
  private String reason;
  private String priority;            // LOW, NORMAL, URGENT

  // Notes fields (for post-consultation update)
  private String doctorNotes;
  private String diagnosis;
  private String prescription;
  private String followUpInstructions;
  private String followUpDate;        // "2026-04-10T10:00:00"
}