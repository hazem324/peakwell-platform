package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class ActivityByTypeDTO {
    private String action;
    private long count;
}
