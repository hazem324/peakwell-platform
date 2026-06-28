package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    //  Link with Keycloak
    @Column(unique = true, nullable = false)
    String keycloakId;

    @Column(unique = true, nullable = false)
    String email;

    String firstName;
    String lastName;
    String phoneNumber;
    String imgUrl;
    @Embedded
    Address address;

    @Temporal(TemporalType.TIMESTAMP)
    Date createdAt;

    //  Automatically executed before INSERT
    @PrePersist
    public void prePersist() {
        this.createdAt = new Date();
    }

    @Enumerated(EnumType.STRING)
    Role role;

    @Column(nullable = false)
    boolean enabled = true;

    @Column(nullable = false)
    boolean profileCompleted = false;

    int failedAttempts = 0;
    int totalFailedAttempts = 0;

    boolean accountLocked = false;

    @Temporal(TemporalType.TIMESTAMP)
    Date lockTime;

    LocalDateTime lastLoginAt;
    LocalDateTime lastSeenAt;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    Student student;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    Dietitian dietitian;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    Restaurant restaurant;
}