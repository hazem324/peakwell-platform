package tn.esprit.peakwell.dto;

public class EventPredictionRequest {

    private String sportType;
    private String location;
    private Integer hour;
    private Integer dayOfWeek;
    private Integer month;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private Integer location_population;
    private Double location_area_km2;
    private Double location_density;

    public EventPredictionRequest() {}

    public String getSportType() {
        return sportType;
    }

    public void setSportType(String sportType) {
        this.sportType = sportType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public Integer getCurrentParticipants() {
        return currentParticipants;
    }

    public void setCurrentParticipants(Integer currentParticipants) {
        this.currentParticipants = currentParticipants;
    }

    public Integer getLocation_population() {
        return location_population;
    }

    public void setLocation_population(Integer location_population) {
        this.location_population = location_population;
    }

    public Double getLocation_area_km2() {
        return location_area_km2;
    }

    public void setLocation_area_km2(Double location_area_km2) {
        this.location_area_km2 = location_area_km2;
    }

    public Double getLocation_density() {
        return location_density;
    }

    public void setLocation_density(Double location_density) {
        this.location_density = location_density;
    }
}