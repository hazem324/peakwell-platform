package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id")
  private MedicalProfile profile;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "dietitian_id")
  private Dietitian dietitian;

  @Column(nullable = false)
  private LocalDateTime scheduledAt;
  private Integer durationMinutes;
  @Column(nullable = false) @Builder.Default
  private String status = "PENDING_APPROVAL";

  @Column(columnDefinition = "TEXT")
  private String rejectionReason;

  @Column(nullable = false)
  private String doctorName;
  private String doctorSpecialty;
  private String consultationType;

  @Column(columnDefinition = "TEXT") private String doctorNotes;
  @Column(columnDefinition = "TEXT") private String diagnosis;
  @Column(columnDefinition = "TEXT") private String prescription;
  @Column(columnDefinition = "TEXT") private String followUpInstructions;
  private LocalDateTime followUpDate;

  private Double snapshotWeight;
  private Double snapshotBmi;
  private Double snapshotBodyFat;
  private Integer snapshotSystolic;
  private Integer snapshotDiastolic;
  private Double snapshotGlucose;

  @Column(columnDefinition = "TEXT") private String goalSnapshot;
  @Column(columnDefinition = "TEXT") private String aiSummary;
  @Column(columnDefinition = "TEXT") private String reason;
  private String priority;

  @Builder.Default private Boolean reminder24hSent = false;
  @Builder.Default private Boolean reminder1hSent = false;

  @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL, orphanRemoval = true)
  private ConsultationFeedback feedback;

  @Column(nullable = false, updatable = false) @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
  private LocalDateTime completedAt;
  @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL, orphanRemoval = true)
  private Payment payment;
  // Add alongside the existing feedback @OneToOne:
  @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL, orphanRemoval = true)
  private ConsultationRating rating;
}