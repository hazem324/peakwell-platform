package tn.esprit.peakwell.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Student {

    @Id
    Long id;

    @OneToOne
    @JsonIgnore
    @MapsId
    @JoinColumn(name = "id")
    User user;

    Float height;
    Float weight;
    Float bmi;
    String activityLevel;
    String goal;

    @JsonIgnore
    @OneToOne(mappedBy = "student")
    MedicalProfile medicalProfile;
}