package tn.esprit.peakwell.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "patients")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Dietitian {
    @Id
    Long id;

    @OneToOne
    @JsonIgnore
    @MapsId
    @JoinColumn(name = "id")
    User user;


    String specialization;
    String certification;
    String linkUrl;
    Integer experienceYears;
    Double consultationPrice;
    @Column(columnDefinition = "TEXT")
    String bio;

    // ── Working schedule ────────────────────────────────
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "dietitian_working_days", joinColumns = @JoinColumn(name = "dietitian_id"))
    @Column(name = "day")
    List<String> workingDays = new ArrayList<>();

    Integer workStartHour = 9;   // e.g. 9  → 09:00
    Integer workEndHour   = 17;  // e.g. 17 → 17:00

    @JsonIgnore
    @OneToMany(mappedBy = "assignedDietitian")
    List<MedicalProfile> patients = new ArrayList<>();
}