package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.SavedArticleDTO;
import tn.esprit.peakwell.services.SavedArticleService;
import tn.esprit.peakwell.services.CurrentUserService;
import tn.esprit.peakwell.exception.UnauthorizedException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-articles")
@CrossOrigin("*")
public class SavedArticleController {
    private final SavedArticleService savedArticleService;
    private final CurrentUserService currentUserService;

    public SavedArticleController(SavedArticleService savedArticleService, CurrentUserService currentUserService) {
        this.savedArticleService = savedArticleService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/toggle")
    public ResponseEntity<Void> toggleSave(@RequestBody Map<String, Object> request) {
        Long articleId = ((Number) request.get("articleId")).longValue();
        String userId = currentUserService.getCurrentUserId();

        savedArticleService.toggleSave(articleId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userIdentifier}")
    public ResponseEntity<List<SavedArticleDTO>> getSavedArticles(@PathVariable String userIdentifier) {
        String currentUserId = currentUserService.getCurrentUserId();

        // Only allow users to view their own saved articles
        if (currentUserId != null && !currentUserId.equals(userIdentifier)) {
            throw new UnauthorizedException("Cannot view other users' saved articles");
        }

        return ResponseEntity.ok(savedArticleService.getSavedArticles(userIdentifier));
    }

    @GetMapping("/check/{articleId}/{userIdentifier}")
    public ResponseEntity<Boolean> checkIfSaved(@PathVariable Long articleId, @PathVariable String userIdentifier) {
        return ResponseEntity.ok(savedArticleService.isSaved(articleId, userIdentifier));
    }
}