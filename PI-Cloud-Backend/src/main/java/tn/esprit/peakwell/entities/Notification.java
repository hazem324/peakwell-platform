package tn.esprit.peakwell.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id")
  private MedicalProfile profile;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "dietitian_id")
  private Dietitian dietitian;

  @Column(nullable = false)
  private String type;  // HEALTH_ALERT, APPOINTMENT_REMINDER, GOAL_UPDATE, SYSTEM, CRITICAL_RISK

  @Column(nullable = false)
  private String severity;  // LOW, MEDIUM, HIGH, CRITICAL

  @Column(nullable = false)
  private String title;

  @Column(length = 1000)
  private String message;

  private String icon;

  private String actionUrl;  // e.g. "/dossier" or "/consultations"

  private String actionLabel;  // e.g. "Book Appointment"

  @Column(name = "is_read")
  @Builder.Default
  private Boolean read = false;

  @Builder.Default
  private Boolean dismissed = false;

  @Column(updatable = false)
  private LocalDateTime createdAt;

  private LocalDateTime readAt;

  @PrePersist
  protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}