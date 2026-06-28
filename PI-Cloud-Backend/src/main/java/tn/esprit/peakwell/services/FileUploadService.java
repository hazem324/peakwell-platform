package tn.esprit.peakwell.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileUploadService implements IFileUploadService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile file, String role, String type) {

        try {
            if (file == null || file.isEmpty()) return null;

            String folder = "peakwell/" + role.toLowerCase();

            if (type != null && !type.isEmpty()) {
                folder += "/" + type;
            }

            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "auto"
                    )
            );

            return uploadResult.get("secure_url").toString();

        } catch (IOException e) {
            throw new RuntimeException("Cloudinary upload failed");
        }
    }
}