package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String gender;
    private String bloodType;
    private Double height;
    private String emergencyContact;

    @Column(nullable = false)
    @Builder.Default
    private Boolean complete = false;

    @ElementCollection
    @CollectionTable(
            name = "profile_allergies",
            joinColumns = @JoinColumn(name = "profile_id"),
            foreignKey = @ForeignKey(name = "fk_allergies_profile")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Column(name = "allergy")
    @Builder.Default
    private List<String> allergies = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "profile_conditions",
            joinColumns = @JoinColumn(name = "profile_id"),
            foreignKey = @ForeignKey(name = "fk_conditions_profile")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Column(name = "condition_name")
    @Builder.Default
    private List<String> conditions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "profile_medications",
            joinColumns = @JoinColumn(name = "profile_id"),
            foreignKey = @ForeignKey(name = "fk_medications_profile")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Column(name = "medication")
    @Builder.Default
    private List<String> medications = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BiometricEntry> biometricEntries = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SymptomEntry> symptomEntries = new ArrayList<>();

    // ── Relations to User module ─────────────────────────────────────────
    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "dietitian_id")
    private Dietitian assignedDietitian;
}