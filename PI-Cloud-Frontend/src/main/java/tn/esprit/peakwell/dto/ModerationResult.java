package tn.esprit.peakwell.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ModerationResult {
    private boolean allowed;
    private List<String> detectedWords;
    private String category;

    public static ModerationResult allowed() {
        return new ModerationResult(true, List.of(), "NONE");
    }

    public boolean isAllowed() {
        return allowed;
    }

    public List<String> getDetectedWords() {
        return detectedWords;
    }

    public String getCategory() {
        return category;
    }
}
