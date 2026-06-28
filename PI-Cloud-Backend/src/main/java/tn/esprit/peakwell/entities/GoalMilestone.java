package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "goal_milestones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalMilestone {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "goal_id", nullable = false)
  private HealthGoal goal;

  @Column(nullable = false)
  private String label;           // "25% milestone", "50% — halfway!", etc.

  @Column(nullable = false)
  private Double targetValue;

  @Builder.Default
  private Boolean reached = false;

  private String reachedDate;     // "Mar 16" — stored as display string

  @Column(columnDefinition = "TEXT")
  private String note;
}