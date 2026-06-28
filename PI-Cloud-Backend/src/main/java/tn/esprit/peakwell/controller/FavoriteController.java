package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.services.FavoriteService;

import java.util.List;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PutMapping("/{mealId}")
    public void toggleFavorite(@PathVariable Long mealId) {
        favoriteService.toggleFavorite(mealId);
    }

    @GetMapping
    public List<Long> getFavorites() {
        return favoriteService.getFavoriteMealIds();
    }
}