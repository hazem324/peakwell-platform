package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class TopUserAgentDTO {
    private String userAgent;
    private long count;
}
