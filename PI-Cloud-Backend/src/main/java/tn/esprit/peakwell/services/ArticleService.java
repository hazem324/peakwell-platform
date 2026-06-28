package tn.esprit.peakwell.services;

import org.springframework.scheduling.annotation.Async;
import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.repositories.ArticleRepository;
import tn.esprit.peakwell.dto.ArticleDTO;
import tn.esprit.peakwell.exception.UnauthorizedException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CurrentUserService currentUserService;
    private final String UPLOAD_DIR = "uploads/articles";
    private final GroqService groqService;

    public ArticleService(ArticleRepository articleRepository, CurrentUserService currentUserService, GroqService groqService) {
        this.articleRepository = articleRepository;
        this.currentUserService = currentUserService;
        this.groqService = groqService;
    }

    // ✅ CREATE
    public Article createArticle(Article article) {
        // Set owner from current authenticated user
        String currentUserId = currentUserService.getCurrentUserId();
        article.setOwnerId(currentUserId);

        // ✅ Récupère automatiquement le username depuis CurrentUserService
        String currentUsername = currentUserService.getCurrentUsername();
        article.setAuthor(currentUsername);

        // Validate content is not empty after sanitization
        if (article.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty or contain only HTML tags");
        }

        // 1️⃣ SAVE FIRST
        Article savedArticle = articleRepository.save(article);

        // 2️⃣ TRIGGER AI GENERATION (ASYNC)
        generateAIContentAsync(savedArticle);

        return articleRepository.save(article);
    }

    // ✅ GET ALL (Paginated)
    public Page<ArticleDTO> getAllArticles(int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return articleRepository.findAll(pageable)
                .map(this::mapArticleToDTO);
    }

    // ✅ GET ALL (Non-paginated)
    public List<ArticleDTO> getAllArticlesAsList() {
        return articleRepository.findAll()
                .stream()
                .map(this::mapArticleToDTO)
                .toList();
    }

    // ✅ GET BY ID
    public ArticleDTO getArticleById(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found: " + id));
        return mapArticleToDTO(article);
    }

    // ✅ UPDATE
    public Article updateArticle(Long id, Article articleDetails) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found: " + id));

        // Check ownership
        String currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId != null && article.getOwnerId() != null
                && !article.getOwnerId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only edit your own articles");
        }

        // 🔥 Déterminer si le contenu a changé
        boolean contentChanged =
                (articleDetails.getTitle() != null && !articleDetails.getTitle().equals(article.getTitle())) ||
                        (articleDetails.getContent() != null && !articleDetails.getContent().equals(article.getContent()));

        article.setTitle(articleDetails.getTitle());
        article.setContent(articleDetails.getContent());
        // ❌ author n'est PAS modifié - reste celui existant

        if (articleDetails.getImageUrl() != null) {
            article.setImageUrl(articleDetails.getImageUrl());
        }
        if (articleDetails.getEmbedUrl() != null) {
            article.setEmbedUrl(articleDetails.getEmbedUrl());
        }

        // 1️⃣ SAVE FIRST
        Article savedArticle = articleRepository.save(article);

        // 2️⃣ REGENERATE AI ONLY IF CONTENT CHANGED
        if (contentChanged) {
            generateAIContentAsync(savedArticle);
        }

        return articleRepository.save(article);
    }

    // ✅ DELETE
    public void deleteArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found: " + id));

        // Check ownership
        String currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId != null && article.getOwnerId() != null
                && !article.getOwnerId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only delete your own articles");
        }

        articleRepository.delete(article);
    }

    // ✅ GET BY AUTHOR
    public List<ArticleDTO> getArticlesByAuthor(String author) {
        return articleRepository.findByAuthor(author)
                .stream()
                .map(this::mapArticleToDTO)
                .toList();
    }

    // ✅ SEARCH BY TITLE
    public List<ArticleDTO> searchArticlesByTitle(String title) {
        return articleRepository.findByTitleContaining(title)
                .stream()
                .map(this::mapArticleToDTO)
                .toList();
    }

    // ✅ SEARCH ARTICLES WITH FILTERS
    public Page<ArticleDTO> searchArticles(
            String search,
            String author,
            String dateFilter,
            String sortBy,
            int page,
            int size) {

        // Calculate date range
        LocalDateTime startDate = null;
        LocalDateTime endDate = LocalDateTime.now();

        if (dateFilter != null && !dateFilter.isEmpty()) {
            switch (dateFilter) {
                case "week":
                    startDate = LocalDateTime.now().minusWeeks(1);
                    break;
                case "month":
                    startDate = LocalDateTime.now().minusMonths(1);
                    break;
                case "year":
                    startDate = LocalDateTime.now().minusYears(1);
                    break;
                default:
                    startDate = null;
            }
        }

        // Normalize empty strings to null
        String searchParam = (search != null && !search.trim().isEmpty())
                ? search.trim() : null;
        String authorParam = (author != null && !author.trim().isEmpty())
                ? author.trim() : null;

        // For likes/comments sorting: fetch without DB sort, sort in memory
        if ("likes".equals(sortBy) || "comments".equals(sortBy)) {

            // Fetch large page to sort in memory
            Pageable fetchAll = PageRequest.of(0, Integer.MAX_VALUE);
            Page<Article> allResults = articleRepository.searchArticles(
                    searchParam, authorParam, startDate, endDate, fetchAll);

            // Sort in memory
            Comparator<Article> comparator;
            if ("likes".equals(sortBy)) {
                comparator = Comparator.comparingInt(
                        a -> -(a.getReactions() != null ? a.getReactions().size() : 0)
                );
            } else {
                comparator = Comparator.comparingInt(
                        a -> -(a.getComments() != null ? a.getComments().size() : 0)
                );
            }

            List<ArticleDTO> sorted = allResults.getContent()
                    .stream()
                    .sorted(comparator)
                    .map(this::mapArticleToDTO)
                    .collect(Collectors.toList());

            // Manual pagination on sorted list
            int start = page * size;
            int end = Math.min(start + size, sorted.size());

            if (start >= sorted.size()) {
                return new PageImpl<>(
                        List.of(),
                        PageRequest.of(page, size),
                        sorted.size()
                );
            }

            return new PageImpl<>(
                    sorted.subList(start, end),
                    PageRequest.of(page, size),
                    sorted.size()
            );

        } else {
            // Default: sort by date DESC
            Pageable pageable = PageRequest.of(page, size,
                    Sort.by(Sort.Direction.DESC, "createdAt"));

            return articleRepository.searchArticles(
                            searchParam, authorParam, startDate, endDate, pageable)
                    .map(this::mapArticleToDTO);
        }
    }

    // ✅ MAPPER Article → DTO
    public ArticleDTO mapArticleToDTO(Article article) {

        ArticleDTO dto = new ArticleDTO();

        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setContent(article.getContent());
        dto.setAuthor(article.getAuthor());
        dto.setOwnerId(article.getOwnerId());
        dto.setImageUrl(article.getImageUrl());
        dto.setEmbedUrl(article.getEmbedUrl());
        dto.setCreatedAt(article.getCreatedAt());
        dto.setUpdatedAt(article.getUpdatedAt());

        // ✅ AI fields
        dto.setAiSummary(article.getAiSummary());

        if (article.getAiTags() != null && !article.getAiTags().isEmpty()) {
            dto.setAiTags(
                    List.of(article.getAiTags().split(","))
                            .stream()
                            .map(String::trim)
                            .toList()
            );
        } else {
            dto.setAiTags(List.of());
        }

        return dto;
    }

    // ✅ SAVE IMAGE
    public String saveImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file cannot be empty");
        }

        // Validate file is actually an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image. Received: " + contentType);
        }

        Path uploadsPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadsPath)) {
            Files.createDirectories(uploadsPath);
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName != null
                ? originalFileName.substring(originalFileName.lastIndexOf("."))
                : ".jpg";
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadsPath.resolve(uniqueFileName);
        Files.write(filePath, file.getBytes());

        System.out.println("Image saved successfully: " + uniqueFileName);
        return uniqueFileName;
    }

    // ✅ DELETE IMAGE
    public void deleteImage(String filename) {
        if (filename == null || filename.isEmpty()) {
            System.out.println("Cannot delete image: filename is empty");
            return;
        }

        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            if (Files.deleteIfExists(filePath)) {
                System.out.println("Image deleted successfully: " + filename);
            } else {
                System.out.println("Image file not found: " + filename);
            }
        } catch (IOException e) {
            System.err.println("Error deleting image " + filename + ": " + e.getMessage());
        }
    }

    // ✅ GET IMAGE AS RESOURCE
    public Resource getImageAsResource(String filename) throws IOException {
        if (filename == null || filename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }

        // Prevent directory traversal attacks
        if (filename.contains("..") || filename.contains("/")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            System.err.println("Image resource not found: " + filename);
            throw new IOException("Image not found: " + filename);
        }

        return resource;
    }

    @Async
    public void generateAIContentAsync(Article article) {

        try {
            String summary = groqService.generateSummary(
                    article.getTitle(),
                    article.getContent()
            );

            String tags = groqService.generateTags(
                    article.getTitle(),
                    article.getContent()
            );

            Article dbArticle = articleRepository.findById(article.getId())
                    .orElse(null);

            if (dbArticle != null) {
                dbArticle.setAiSummary(summary);
                dbArticle.setAiTags(tags);
                articleRepository.save(dbArticle);
            }

        } catch (Exception e) {
            System.out.println("AI generation failed: " + e.getMessage());
        }
    }
}