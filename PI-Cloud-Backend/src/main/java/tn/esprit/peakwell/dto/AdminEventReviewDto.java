package tn.esprit.peakwell.dto;

import java.time.LocalDateTime;

public class AdminEventReviewDto {

    private Long id;
    private Integer rating;
    private String comment;
    private LocalDateTime reviewDate;

    private Long studentId;
    private String studentName;
    private String studentImageUrl;

    public AdminEventReviewDto() {
    }

    public AdminEventReviewDto(Long id, Integer rating, String comment, LocalDateTime reviewDate,
                               Long studentId, String studentName, String studentImageUrl) {
        this.id = id;
        this.rating = rating;
        this.comment = comment;
        this.reviewDate = reviewDate;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentImageUrl = studentImageUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDateTime reviewDate) {
        this.reviewDate = reviewDate;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentImageUrl() {
        return studentImageUrl;
    }

    public void setStudentImageUrl(String studentImageUrl) {
        this.studentImageUrl = studentImageUrl;
    }
}