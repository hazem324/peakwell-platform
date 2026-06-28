package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.ReactionDTO;
import tn.esprit.peakwell.services.ReactionService;
import tn.esprit.peakwell.services.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reactions")
@CrossOrigin("*")
public class ReactionController {
    private final ReactionService reactionService;
    private final CurrentUserService currentUserService;

    public ReactionController(ReactionService reactionService, CurrentUserService currentUserService) {
        this.reactionService = reactionService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/article/{articleId}")
    public ResponseEntity<Void> toggleReaction(
            @PathVariable Long articleId,
            @RequestBody Map<String, String> request) {
        String type = request.get("type");
        String userId = currentUserService.getCurrentUserId();
        reactionService.toggleReaction(articleId, type, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/article/{articleId}")
    public ResponseEntity<List<ReactionDTO>> getReactions(@PathVariable Long articleId) {
        return ResponseEntity.ok(reactionService.getReactionsByArticle(articleId));
    }

    @GetMapping("/article/{articleId}/count")
    public ResponseEntity<Map<String, Long>> getReactionCounts(@PathVariable Long articleId) {
        return ResponseEntity.ok(reactionService.getReactionCounts(articleId));
    }
}