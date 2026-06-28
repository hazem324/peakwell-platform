package tn.esprit.peakwell.controller;

import org.springframework.http.ResponseEntity;
import tn.esprit.peakwell.entities.Comment;
import tn.esprit.peakwell.dto.CommentDTO;
import tn.esprit.peakwell.services.CommentService;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin("*")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    // ✅ ADD COMMENT (author automatique)
    @PostMapping("/article/{articleId}")
    public Comment addComment(@PathVariable Long articleId, @Valid @RequestBody CommentDTO commentDTO) {
        return commentService.addComment(articleId, commentDTO);
    }

    // ✅ GET ALL COMMENTS OF AN ARTICLE
    @GetMapping("/article/{articleId}")
    public List<CommentDTO> getCommentsByArticle(@PathVariable Long articleId) {
        return commentService.getCommentsByArticle(articleId);
    }

    // ✅ DELETE COMMENT
    @DeleteMapping("/{id}")
    public void deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
    }

    // ✅ ADD REPLY (author automatique)
    @PostMapping("/{articleId}/reply/{parentCommentId}")
    public ResponseEntity<CommentDTO> addReply(
            @PathVariable Long articleId,
            @PathVariable Long parentCommentId,
            @RequestBody CommentDTO dto) {
        CommentDTO reply = commentService.addReply(articleId, parentCommentId, dto);
        return ResponseEntity.ok(reply);
    }

    // ✅ VOTE ON COMMENT
    @PostMapping("/{commentId}/vote")
    public ResponseEntity<Map<String, Object>> voteComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> request) {
        String voteType = request.get("voteType");
        String userIdentifier = request.get("userIdentifier");
        Map<String, Object> response = commentService.voteComment(
                commentId, voteType, userIdentifier
        );
        return ResponseEntity.ok(response);
    }
}