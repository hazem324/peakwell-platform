package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.AttachmentDTO;
import tn.esprit.peakwell.services.AttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin("*")
public class AttachmentController {
    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/article/{articleId}")
    public ResponseEntity<AttachmentDTO> uploadAttachment(
            @PathVariable Long articleId,
            @RequestParam("file") MultipartFile file) {
        AttachmentDTO attachment = attachmentService.uploadAttachment(articleId, file);
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/article/{articleId}")
    public ResponseEntity<List<AttachmentDTO>> getAttachments(@PathVariable Long articleId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByArticle(articleId));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        try {
            Resource resource = attachmentService.downloadAttachment(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok().build();
    }
}
