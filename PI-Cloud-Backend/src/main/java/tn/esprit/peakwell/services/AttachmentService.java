package tn.esprit.peakwell.services;

import tn.esprit.peakwell.dto.AttachmentDTO;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import java.util.List;

public interface AttachmentService {
    AttachmentDTO uploadAttachment(Long articleId, MultipartFile file);
    List<AttachmentDTO> getAttachmentsByArticle(Long articleId);
    Resource downloadAttachment(Long id);
    void deleteAttachment(Long id);
}
