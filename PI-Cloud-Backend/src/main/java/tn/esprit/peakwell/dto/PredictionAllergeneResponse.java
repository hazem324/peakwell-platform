package tn.esprit.peakwell.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PredictionAllergeneResponse {

    @JsonProperty("predictedAllergens")
    private List<String> predictedAllergens;

    private Map<String, Double> confidence;

    public PredictionAllergeneResponse() {}

    public List<String> getPredictedAllergens() {
        return predictedAllergens;
    }

    public void setPredictedAllergens(List<String> predictedAllergens) {
        this.predictedAllergens = predictedAllergens;
    }

    public Map<String, Double> getConfidence() {
        return confidence;
    }

    public void setConfidence(Map<String, Double> confidence) {
        this.confidence = confidence;
    }
}