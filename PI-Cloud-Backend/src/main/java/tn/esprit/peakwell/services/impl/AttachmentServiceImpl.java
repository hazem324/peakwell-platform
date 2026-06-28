package tn.esprit.peakwell.services.impl;

import tn.esprit.peakwell.dto.AttachmentDTO;
import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.entities.Attachment;
import tn.esprit.peakwell.repositories.ArticleRepository;
import tn.esprit.peakwell.repositories.AttachmentRepository;
import tn.esprit.peakwell.services.AttachmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AttachmentServiceImpl implements AttachmentService {
    private final AttachmentRepository attachmentRepository;
    private final ArticleRepository articleRepository;
    private final String UPLOAD_DIR = "uploads/attachments";

    public AttachmentServiceImpl(AttachmentRepository attachmentRepository, ArticleRepository articleRepository) {
        this.attachmentRepository = attachmentRepository;
        this.articleRepository = articleRepository;
    }

    @Override
    public AttachmentDTO uploadAttachment(Long articleId, MultipartFile file) {
        try {
            Article article = articleRepository.findById(articleId)
                    .orElseThrow(() -> new RuntimeException("Article not found"));

            // Create upload directory
            Path uploadsPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadsPath)) {
                Files.createDirectories(uploadsPath);
            }

            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName != null ? originalFileName.substring(originalFileName.lastIndexOf(".")) : "";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadsPath.resolve(uniqueFileName);
            Files.write(filePath, file.getBytes());

            // Save metadata to database
            Attachment attachment = Attachment.builder()
                    .fileName(originalFileName)
                    .filePath(uniqueFileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .article(article)
                    .build();

            Attachment saved = attachmentRepository.save(attachment);
            return mapAttachmentToDTO(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    public List<AttachmentDTO> getAttachmentsByArticle(Long articleId) {
        return attachmentRepository.findByArticleId(articleId)
                .stream()
                .map(this::mapAttachmentToDTO)
                .toList();
    }

    @Override
    public Resource downloadAttachment(Long id) {
        try {
            Attachment attachment = attachmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Attachment not found"));

            Path filePath = Paths.get(UPLOAD_DIR).resolve(attachment.getFilePath());
            return new UrlResource(filePath.toUri());
        } catch (Exception e) {
            throw new RuntimeException("Failed to load attachment: " + e.getMessage());
        }
    }

    @Override
    public void deleteAttachment(Long id) {
        try {
            Attachment attachment = attachmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Attachment not found"));

            Path filePath = Paths.get(UPLOAD_DIR).resolve(attachment.getFilePath());
            Files.deleteIfExists(filePath);

            attachmentRepository.delete(attachment);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete attachment: " + e.getMessage());
        }
    }

    private AttachmentDTO mapAttachmentToDTO(Attachment attachment) {
        return new AttachmentDTO(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFilePath(),
                attachment.getFileType(),
                attachment.getFileSize(),
                attachment.getArticle().getId(),
                attachment.getCreatedAt()
        );
    }
}
