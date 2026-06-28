package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationRating {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "consultation_id", nullable = false, unique = true)
  private Consultation consultation;

  @Column(nullable = false)
  private Integer overallRating;          // 1-5 stars

  private Integer doctorKnowledgeRating;  // 1-5
  private Integer communicationRating;    // 1-5
  private Integer adviceUsefulnessRating; // 1-5
  private Integer punctualityRating;      // 1-5

  private Boolean wouldRecommend;

  @Column(columnDefinition = "TEXT")
  private String feedback;                // free text

  @Column(columnDefinition = "TEXT")
  private String improvements;            // what could be better

  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
}