package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.dto.ArticleDTO;
import tn.esprit.peakwell.services.ArticleService;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/articles")
@CrossOrigin("*")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    // ✅ CREATE (author est automatiquement récupéré du JWT)
    @PostMapping
    public ResponseEntity<?> createArticle(
            @RequestParam(value = "title") String title,
            @RequestParam(value = "content") String content,
            @RequestParam(value = "embedUrl", required = false) String embedUrl,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Title is required");
            }
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            String imageUrl = null;
            if (image != null && !image.isEmpty()) {
                imageUrl = articleService.saveImage(image);
            }

            Article article = new Article();
            article.setTitle(title.trim());
            article.setContent(content.trim());
            article.setImageUrl(imageUrl);
            article.setEmbedUrl(embedUrl != null ? embedUrl.trim() : null);
            // ❌ author n'est PAS défini ici - sera défini dans createArticle()

            return ResponseEntity.ok(articleService.createArticle(article));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating article: " + e.getMessage());
        }
    }

    // ✅ GET ALL (Paginated)
    @GetMapping
    public ResponseEntity<Page<ArticleDTO>> getAllArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size) {
        return ResponseEntity.ok(articleService.getAllArticles(page, size));
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getArticle(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(articleService.getArticleById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Article not found with id: " + id);
        }
    }

    // ✅ UPDATE (author reste inchangé, ni envoyé ni modifié)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "embedUrl", required = false) String embedUrl,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("Invalid article ID");
            }

            ArticleDTO existingArticle = articleService.getArticleById(id);

            String imageUrl = existingArticle.getImageUrl();
            if (image != null && !image.isEmpty()) {
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    articleService.deleteImage(imageUrl);
                }
                imageUrl = articleService.saveImage(image);
            }

            Article article = new Article();
            article.setTitle(title != null ? title.trim() : existingArticle.getTitle());
            article.setContent(content != null ? content.trim() : existingArticle.getContent());
            // ❌ author n'est PAS modifié - reste celui existant
            article.setImageUrl(imageUrl);
            article.setEmbedUrl(embedUrl != null ? embedUrl.trim() : existingArticle.getEmbedUrl());

            Article updatedArticle = articleService.updateArticle(id, article);
            return ResponseEntity.ok(articleService.mapArticleToDTO(updatedArticle));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error updating article: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server error: " + e.getMessage());
        }
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteArticle(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("Invalid article ID");
            }

            ArticleDTO article = articleService.getArticleById(id);
            if (article.getImageUrl() != null && !article.getImageUrl().isEmpty()) {
                articleService.deleteImage(article.getImageUrl());
            }
            articleService.deleteArticle(id);
            return ResponseEntity.ok("Article deleted successfully");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error deleting article: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server error: " + e.getMessage());
        }
    }

    // ✅ GET BY AUTHOR
    @GetMapping("/author/{author}")
    public ResponseEntity<List<ArticleDTO>> getArticlesByAuthor(@PathVariable String author) {
        return ResponseEntity.ok(articleService.getArticlesByAuthor(author));
    }

    // ✅ SEARCH BY TITLE
    @GetMapping("/search/{title}")
    public ResponseEntity<List<ArticleDTO>> searchArticlesByTitle(@PathVariable String title) {
        return ResponseEntity.ok(articleService.searchArticlesByTitle(title));
    }

    // ✅ SERVE IMAGES
    @GetMapping("/images/{filename}")
    public ResponseEntity<?> getImage(@PathVariable String filename) {
        try {
            if (filename == null || filename.isEmpty()) {
                return ResponseEntity.badRequest().body("Filename cannot be empty");
            }

            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().body("Invalid filename");
            }

            if (!filename.contains(".")) {
                return ResponseEntity.badRequest().body("Invalid image filename - missing extension");
            }

            Resource resource = articleService.getImageAsResource(filename);

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(resource);
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Image not found: " + filename);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Image not found: " + filename);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error serving image");
        }
    }

    // ✅ SEARCH WITH FILTERS
    @GetMapping("/search")
    public ResponseEntity<Page<ArticleDTO>> searchArticles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String dateFilter,
            @RequestParam(required = false, defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        return ResponseEntity.ok(
                articleService.searchArticles(search, author, dateFilter, sortBy, page, size));
    }
}