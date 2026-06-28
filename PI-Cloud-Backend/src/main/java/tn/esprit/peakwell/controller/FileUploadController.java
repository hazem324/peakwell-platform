package tn.esprit.peakwell.controller;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.UUID;

@Controller
@RequestMapping("/api/files")
public class FileUploadController {


    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {

        try {
            // Validation
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("Only images allowed");
            }

            if (file.getSize() > 2 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("Max size 2MB");
            }

            File folder = new File(UPLOAD_DIR);
            if (!folder.exists()) folder.mkdirs();

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            File destination = new File(UPLOAD_DIR + fileName);
            file.transferTo(destination);

            String fileUrl = "http://localhost:8080/uploads/" + fileName;

            return ResponseEntity.ok(fileUrl);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed");
        }
    }
}
    

