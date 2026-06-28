package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suggested_slots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestedSlot {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** The consultation that was rejected and triggered these suggestions */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "original_consultation_id")
  private Consultation originalConsultation;

  /** The proposed new date/time for the appointment */
  @Column(nullable = false)
  private LocalDateTime proposedAt;

  /** UUID sent in the confirmation link emailed to the patient */
  @Column(nullable = false, unique = true)
  private String token;

  /** True once the patient has clicked the link and a new consultation was created */
  @Builder.Default
  private boolean used = false;

  /** Link expires 72 h after creation */
  @Column(nullable = false)
  private LocalDateTime expiresAt;

  @Column(nullable = false, updatable = false)
  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
}
