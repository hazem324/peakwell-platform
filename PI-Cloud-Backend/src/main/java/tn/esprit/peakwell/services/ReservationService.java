package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import tn.esprit.peakwell.dto.PlanReservationDTO;
import tn.esprit.peakwell.entities.DailyMenu;
import tn.esprit.peakwell.entities.DailyPlan;
import tn.esprit.peakwell.entities.Reservation;
import tn.esprit.peakwell.repositories.DailyMenuRepository;
import tn.esprit.peakwell.repositories.ReservationRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.repositories.DailyPlanRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final DailyMenuRepository menuRepository;
    private final DailyPlanRepository dailyPlanRepository;
    private final UserRepository userRepository;

    // MENU RESERVATION 
    public void toggleReservation(Long menuId) {

        String userId = getCurrentUserId();

        DailyMenu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new RuntimeException("Menu not found"));

        List<Reservation> existing = reservationRepository.findByUserId(userId);

        if (!existing.isEmpty()) {

            Reservation res = existing.get(0);

            // user a déjà réservé un plan
            if (res.getPlan() != null) {
                throw new RuntimeException("Vous avez déjà réservé un plan");
            }

            // ✔ toggle (annuler si même menu)
            if (res.getDailyMenu() != null &&
                res.getDailyMenu().getId().equals(menuId)) {

                reservationRepository.delete(res);
                return;
            }

            // autre menu déjà réservé
            throw new RuntimeException("Vous avez déjà réservé un menu");
        }

        // réservation menu
        Reservation r = new Reservation();
        r.setUserId(userId);
        r.setDailyMenu(menu);
        r.setType("MENU");

        reservationRepository.save(r);
    }

    // PLAN RESERVATION
    public void reservePlan(Long planId) {

        String userId = getCurrentUserId();

        DailyPlan plan = dailyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan introuvable avec id = " + planId));

        List<Reservation> existing = reservationRepository.findByUserId(userId);

        if (!existing.isEmpty()) {

            Reservation res = existing.get(0);

            // user a déjà un menu
            if (res.getDailyMenu() != null) {
                throw new RuntimeException("Vous avez déjà réservé un menu");
            }

            // si même plan → ignore 
            if (res.getPlan() != null &&
                res.getPlan().getId().equals(planId)) {

                throw new RuntimeException("Plan déjà réservé");
            }

            // autre plan déjà réservé
            if (res.getPlan() != null) {
                throw new RuntimeException("Vous avez déjà réservé un autre plan");
            }
        }

        // réservation plan
        Reservation r = new Reservation();
        r.setUserId(userId);
        r.setPlan(plan);
        r.setType("PLAN");

        reservationRepository.save(r);
    }

    // COUNT MENU
    public int getReservationCount(Long menuId) {
        return reservationRepository.countByDailyMenuId(menuId);
    }

    // CHECK MENU RESERVED
    public boolean isReserved(Long menuId) {
        String userId = getCurrentUserId();

        return reservationRepository
                .findByUserIdAndDailyMenuId(userId, menuId)
                .isPresent();
    }

    // USER ID FROM TOKEN
    private String getCurrentUserId() {
        JwtAuthenticationToken token =
                (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        return token.getToken().getSubject();
    }

    public boolean isPlanReserved(Long planId) {

        String userId = getCurrentUserId();

        return reservationRepository
                .findByUserId(userId)
                .stream()
                .anyMatch(r -> r.getPlan() != null &&
                            r.getPlan().getId().equals(planId));
    }

    public void cancelPlanReservation(Long planId) {

        String userId = getCurrentUserId();

        List<Reservation> reservations = reservationRepository.findByUserId(userId);

        Reservation res = reservations.stream()
                .filter(r -> r.getPlan() != null &&
                            r.getPlan().getId().equals(planId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune réservation trouvée"));

        reservationRepository.delete(res);
    }

    public long getPlanReservationCount() {
            return reservationRepository.countByPlanIsNotNull();
    }

    public List<PlanReservationDTO> getPlanReservations() {

        List<Reservation> reservations = reservationRepository.findByPlanIsNotNull();

        return reservations.stream().map(r -> {

            DailyPlan p = r.getPlan();

            return new PlanReservationDTO(

                userRepository.findByKeycloakId(r.getUserId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Utilisateur"), 

                p.getBreakfast() != null ? p.getBreakfast().getName() : null,
                p.getBreakfast() != null ? p.getBreakfast().getImage() : null,

                p.getLunch() != null ? p.getLunch().getName() : null,
                p.getLunch() != null ? p.getLunch().getImage() : null,

                p.getDinner() != null ? p.getDinner().getName() : null,
                p.getDinner() != null ? p.getDinner().getImage() : null
            );

        }).toList();
    }
}