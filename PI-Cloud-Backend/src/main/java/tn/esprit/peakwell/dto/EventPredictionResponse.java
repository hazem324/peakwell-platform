package tn.esprit.peakwell.dto;

public class EventPredictionResponse {

    private String prediction;
    private String resolved_location;
    private String error;

    public EventPredictionResponse() {}

    public String getPrediction() {
        return prediction;
    }

    public void setPrediction(String prediction) {
        this.prediction = prediction;
    }

    public String getResolved_location() {
        return resolved_location;
    }

    public void setResolved_location(String resolved_location) {
        this.resolved_location = resolved_location;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}