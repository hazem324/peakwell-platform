package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.DailyPlanDTO;
import tn.esprit.peakwell.services.PlanService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/plan")
public class PlanController {
    @Autowired
    private PlanService planService;

    @GetMapping("/today")
    public ResponseEntity<DailyPlanDTO> getTodayPlan() {
        return ResponseEntity.ok(planService.generateTodayPlan());
    }
    
}
