package tn.esprit.peakwell.services;

import org.springframework.web.multipart.MultipartFile;

public interface IFileUploadService {

    String uploadFile(MultipartFile file, String role, String type);
    
}
