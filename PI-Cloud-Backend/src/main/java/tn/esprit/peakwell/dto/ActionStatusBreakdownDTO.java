package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class ActionStatusBreakdownDTO {
    private String action;
    private String status;
    private long count;
}