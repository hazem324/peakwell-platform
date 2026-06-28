package tn.esprit.peakwell.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;

import tn.esprit.peakwell.services.MenuService;
import tn.esprit.peakwell.repositories.DailyMenuRepository;

@Component
public class MenuScheduler {

    private final MenuService menuService;
    private final DailyMenuRepository menuRepository;

    public MenuScheduler(MenuService menuService, DailyMenuRepository menuRepository) {
        this.menuService = menuService;
        this.menuRepository = menuRepository;
    }

    // Vérifie si semaine complète
    private boolean isWeekGenerated(LocalDate start) {
        LocalDate end = start.plusDays(6);
        long count = menuRepository.countByDateBetween(start, end);
        return count >= 7;
    }

    // SAMEDI 00:00 → semaine suivante
    @Scheduled(cron = "0 0 0 ? * SAT")
    public void generateNextWeekMenus() {

        LocalDate nextWeek = LocalDate.now()
                .with(java.time.DayOfWeek.MONDAY)
                .plusWeeks(1);

        if (!isWeekGenerated(nextWeek)) {
            System.out.println("Génération semaine prochaine...");
            menuService.generateWeeklyMenu(nextWeek);
            System.out.println("📅 Génération semaine prochaine...");
            //menuService.generateWeeklyMenu(nextWeek);
        }
    }

    // AU DÉMARRAGE → semaine actuelle
    /*@PostConstruct
    public void generateMenuAtStartup() {

        LocalDate currentWeek = LocalDate.now()
                .with(java.time.DayOfWeek.MONDAY);

        if (!isWeekGenerated(currentWeek)) {
            System.out.println("Génération semaine actuelle...");
            menuService.generateWeeklyMenu(currentWeek);
            System.out.println("Génération semaine actuelle...");
            //menuService.generateWeeklyMenu(currentWeek);
        } else {
            System.out.println("Semaine déjà générée");
        }
    }*/
}