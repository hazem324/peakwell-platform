package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "health_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthGoal {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id")
  private MedicalProfile profile;

  @Column(nullable = false)
  private String metric;          // weight, bmi, bodyFat, muscleMass, systolic, glucose

  @Column(nullable = false)
  private String direction;       // decrease, increase, maintain

  @Column(nullable = false)
  private Double startValue;

  @Column(nullable = false)
  private Double targetValue;

  private String unit;            // kg, %, mmHg, mg/dL

  @Column(nullable = false)
  private LocalDate deadline;

  @Builder.Default
  private Boolean active = true;

  @Builder.Default
  private Boolean achieved = false;

  private LocalDate achievedDate;

  @Builder.Default
  private Boolean paused = false;

  @Column(columnDefinition = "TEXT")
  private String pauseReason;

  @Builder.Default
  private Boolean assignedByDietitian = false;

  private String assignedByDietitianName;

  @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @Builder.Default
  private List<GoalMilestone> milestones = new ArrayList<>();

  @Column(nullable = false, updatable = false)
  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
}