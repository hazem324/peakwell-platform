package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.Favorite;
import tn.esprit.peakwell.entities.Meal;
import tn.esprit.peakwell.repositories.FavoriteRepository;
import tn.esprit.peakwell.repositories.MealRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final MealRepository mealRepository;

    public void toggleFavorite(Long mealId) {

        String userId = getCurrentUserId();

        Meal meal = mealRepository.findById(mealId)
                .orElseThrow(() -> new RuntimeException("Meal not found"));

        Optional<Favorite> existing =
                favoriteRepository.findByMealIdAndUserId(mealId, userId);

        if (existing.isPresent()) {

            favoriteRepository.delete(existing.get());

            // decrement
            meal.setFavoriteCount(Math.max(0, meal.getFavoriteCount() - 1));

        } else {

            Favorite fav = new Favorite();
            fav.setMeal(meal);
            fav.setUserId(userId);

            favoriteRepository.save(fav);

            // increment
            meal.setFavoriteCount(meal.getFavoriteCount() + 1);
        }

        mealRepository.save(meal);
    }

    public List<Long> getFavoriteMealIds() {

        String userId = getCurrentUserId();

        return favoriteRepository.findByUserId(userId)
                .stream()
                .map(f -> f.getMeal().getId())
                .toList();
    }

    public String getCurrentUserId() {
        JwtAuthenticationToken token =
                (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        return token.getToken().getSubject();
    }
}