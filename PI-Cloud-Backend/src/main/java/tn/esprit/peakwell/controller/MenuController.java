package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.DailyMenuDTO;
import tn.esprit.peakwell.dto.DailyMenuRequest;
import tn.esprit.peakwell.services.MenuService;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/menu")
@CrossOrigin("*")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    // CREATE MANUAL
    @PostMapping
    public DailyMenuDTO createMenu(@RequestBody DailyMenuRequest request) {
        return menuService.createMenu(request);
    }

    // Générer semaine actuelle
    @PostMapping("/generate-current-week")
    public String generateCurrentWeek() {
        menuService.generateCurrentWeek();
        return "Semaine actuelle générée";
    }

    // Générer semaine suivante
    @PostMapping("/generate-next-week")
    public String generateNextWeek() {
        menuService.generateNextWeek();
        return "Semaine suivante générée";
    }

    // Générer semaine personnalisée
    @PostMapping("/generate")
    public List<DailyMenuDTO> generateWeekFromDate(@RequestParam String startDate) {
        LocalDate start = LocalDate.parse(startDate);
        return menuService.generateWeeklyMenu(start);
    }

    // GET TODAY
    @GetMapping("/today")
    public DailyMenuDTO getTodayMenu() {
        return menuService.getTodayMenu();
    }

    // GET ALL
    @GetMapping
    public List<DailyMenuDTO> getAllMenus() {
        return menuService.getAllMenus();
    }

    // GET WEEK
    @GetMapping("/week")
    public List<DailyMenuDTO> getWeeklyMenus() {
        return menuService.getWeeklyMenus();
    }

    // GET BY DATE
    @GetMapping("/{date}")
    public DailyMenuDTO getMenuByDate(@PathVariable String date) {
        return menuService.getMenuByDate(LocalDate.parse(date));
    }

    @DeleteMapping("/{id}")
    public void deleteMenu(@PathVariable Long id) {
        menuService.deleteMenu(id);
    }

    @PutMapping("/reorder")
    public void reorderMenus(@RequestBody List<Long> orderedIds) {
        System.out.println("IDs reçus : " + orderedIds);
        menuService.reorderMenus(orderedIds);
    }
}