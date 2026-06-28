package tn.esprit.peakwell.dto;

public class EventTrainingSampleDto {

    private String category;
    private String governorate;
    private Integer hour;
    private Integer dayOfWeek;
    private Integer month;
    private Integer maxParticipants;
    private String success_level;

    public EventTrainingSampleDto() {
    }

    public EventTrainingSampleDto(String category, String governorate, Integer hour,
                                  Integer dayOfWeek, Integer month,
                                  Integer maxParticipants, String success_level) {
        this.category = category;
        this.governorate = governorate;
        this.hour = hour;
        this.dayOfWeek = dayOfWeek;
        this.month = month;
        this.maxParticipants = maxParticipants;
        this.success_level = success_level;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getGovernorate() {
        return governorate;
    }

    public void setGovernorate(String governorate) {
        this.governorate = governorate;
    }

    public Integer getHour() {
        return hour;
    }

    public void setHour(Integer hour) {
        this.hour = hour;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public String getSuccess_level() {
        return success_level;
    }

    public void setSuccess_level(String success_level) {
        this.success_level = success_level;
    }
}