package tn.esprit.peakwell.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import tn.esprit.peakwell.dto.PlanReservationDTO;
import tn.esprit.peakwell.services.ReservationService;
import java.util.List;

@RestController
@RequestMapping("/reservations")
@CrossOrigin("*")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // toggle
    @PutMapping("/{menuId}")
    public void toggle(@PathVariable Long menuId) {
        reservationService.toggleReservation(menuId);
    }

    // count
    @GetMapping("/count/{menuId}")
    public int count(@PathVariable Long menuId) {
        return reservationService.getReservationCount(menuId);
    }

    @PostMapping("/plan/{planId}")
    public void reservePlan(@PathVariable Long planId) {
        reservationService.reservePlan(planId);
    }

    // check user
    @GetMapping("/check/{menuId}")
    public boolean check(@PathVariable Long menuId) {
        return reservationService.isReserved(menuId);
    }

    @GetMapping("/plan/{planId}/isReserved")
    public boolean isPlanReserved(@PathVariable Long planId) {
        return reservationService.isPlanReserved(planId);
    }

    @DeleteMapping("/plan/{planId}")
    public void cancelPlan(@PathVariable Long planId) {
        reservationService.cancelPlanReservation(planId);
    }
    
    @GetMapping("/plan/count")
    public long getPlanReservationCount() {
        return reservationService.getPlanReservationCount();
    }

    @GetMapping("/plan")
    public List<PlanReservationDTO> getPlanReservations() {
        return reservationService.getPlanReservations();
    }
}
