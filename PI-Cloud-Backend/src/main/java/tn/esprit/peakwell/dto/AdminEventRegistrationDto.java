package tn.esprit.peakwell.dto;

import java.time.LocalDateTime;

public class AdminEventRegistrationDto {

    private Long id;
    private LocalDateTime registrationDate;
    private String status;

    private Long studentId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String imageUrl;

    public AdminEventRegistrationDto() {
    }

    public AdminEventRegistrationDto(Long id, LocalDateTime registrationDate, String status,
                                     Long studentId, String firstName, String lastName,
                                     String fullName, String email, String imageUrl) {
        this.id = id;
        this.registrationDate = registrationDate;
        this.status = status;
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = fullName;
        this.email = email;
        this.imageUrl = imageUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}