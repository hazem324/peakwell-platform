package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationFeedback {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "consultation_id")
  private Consultation consultation;

  private Integer overallRating;        // 1-5
  private Integer doctorKnowledge;      // 1-5
  private Integer communication;        // 1-5
  private Integer helpfulness;          // 1-5
  private Integer wouldRecommend;       // 1-5

  private Boolean adviceFollowed;
  private Boolean symptomsImproved;

  @Column(columnDefinition = "TEXT")
  private String comments;

  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
}