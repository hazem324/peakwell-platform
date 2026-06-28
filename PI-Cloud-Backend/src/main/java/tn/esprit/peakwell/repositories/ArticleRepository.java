package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.peakwell.entities.Article;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    List<Article> findByAuthor(String author);
    List<Article> findByTitleContaining(String title);
    Page<Article> findAll(Pageable pageable);
    Page<Article> findByAuthorContainingIgnoreCase(String author, Pageable pageable);
    Page<Article> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // ✅ FIXED: Removed LOWER() on content (CLOB field)
    // ✅ FIXED: Removed dynamic ORDER BY with CASE WHEN (not supported in JPQL)
    // ✅ FIXED: Removed sortBy param from query (handled in Java)
    @Query("""
        SELECT a FROM Article a
        WHERE (:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:author IS NULL OR LOWER(a.author) LIKE LOWER(CONCAT('%', :author, '%')))
        AND (:startDate IS NULL OR a.createdAt >= :startDate)
        AND (:endDate IS NULL OR a.createdAt <= :endDate)
        """)
    Page<Article> searchArticles(
            @Param("search") String search,
            @Param("author") String author,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}