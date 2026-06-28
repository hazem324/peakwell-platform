package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "symptom_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private LocalDate logDate;

  @Column(nullable = false)
  private String symptom;           // e.g. "Headache", "Fatigue", "Nausea"

  @Column(nullable = false)
  private Integer severity;          // 1-5 (mild to severe)

  private String timeOfDay;          // "morning", "afternoon", "evening", "night"

  private Integer duration;          // in minutes (null = ongoing)

  private String notes;

  private Integer mood;              // 1-5 (very bad to very good)

  private Integer energyLevel;       // 1-5

  private Integer stressLevel;       // 1-5

  @ElementCollection
  @CollectionTable(
    name = "symptom_tags",
    joinColumns = @JoinColumn(name = "symptom_entry_id"),
    foreignKey = @ForeignKey(name = "fk_tags_symptom")
  )
  @Column(name = "tag")
  @Builder.Default
  private List<String> tags = new ArrayList<>();  // e.g. ["after_meal", "exercise", "stress"]

  @ElementCollection
  @CollectionTable(
    name = "symptom_triggers",
    joinColumns = @JoinColumn(name = "symptom_entry_id"),
    foreignKey = @ForeignKey(name = "fk_triggers_symptom")
  )
  @Column(name = "trigger_name")
  @Builder.Default
  private List<String> triggers = new ArrayList<>();  // e.g. ["caffeine", "poor_sleep", "skipped_meal"]

  @Column(nullable = false, updatable = false)
  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id", nullable = false)
  private MedicalProfile profile;
}
