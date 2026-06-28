package tn.esprit.peakwell.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import tn.esprit.peakwell.dto.CaptchaChallenge;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CaptchaService implements ICaptchaService {

    private static final int GRID_SIZE     = 9;
    private static final int CORRECT_COUNT = 4;

    @Value("${captcha.hmac-secret}")
    private String hmacSecret;

    @Value("${captcha.challenge-ttl-minutes}")
    private long challengeTtlMinutes;

    @Value("${cloudinary.captcha-folder}")
    private String captchaFolder;

    @Autowired
    private Cloudinary cloudinary;

    // ----------------------------------------------------------------
    // Generate challenge — fetches real images from Cloudinary folders
    // ----------------------------------------------------------------
    public CaptchaChallenge generateChallenge() throws Exception {

        // Discover category folders under recaptcha/ dynamically
        List<String> categories = listSubFolders(captchaFolder);

        if (categories.size() < 2) {
            throw new RuntimeException(
                    "Need at least 2 sub-folders inside Cloudinary folder: " + captchaFolder
            );
        }

        // Pick a random target category
        Collections.shuffle(categories);
        String target = categories.get(0);

        // Fetch 4 correct images from the target folder
        List<String> correctUrls = fetchImages(captchaFolder + "/" + target, CORRECT_COUNT);

        // Fetch distractor images from the other categories
        List<String> distractors = new ArrayList<>();
        for (String cat : categories.subList(1, categories.size())) {
            distractors.addAll(fetchImages(captchaFolder + "/" + cat, 2));
            if (distractors.size() >= GRID_SIZE - CORRECT_COUNT) break;
        }

        // Combine correct + distractors then shuffle the grid
        List<String> grid = new ArrayList<>(correctUrls);
        grid.addAll(distractors.subList(0, GRID_SIZE - CORRECT_COUNT));
        Collections.shuffle(grid);

        // Record which indices are correct after shuffle
        List<Integer> correctIndices = new ArrayList<>();
        for (int i = 0; i < grid.size(); i++) {
            if (correctUrls.contains(grid.get(i))) {
                correctIndices.add(i);
            }
        }

        // Sign: base64(target|0,2,5,7|timestamp).HMAC
        String payload = target
                + "|" + correctIndices.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","))
                + "|" + System.currentTimeMillis();

        String challengeToken =
                Base64.getEncoder().encodeToString(payload.getBytes(StandardCharsets.UTF_8))
                        + "." + hmac(payload);

        return new CaptchaChallenge(challengeToken, target, grid);
    }

    // ----------------------------------------------------------------
    // Verify selected indices against the signed challenge token
    // ----------------------------------------------------------------
    public boolean verify(String challengeToken, List<Integer> selected) {
        try {
            String[] parts = challengeToken.split("\\.");
            if (parts.length != 2) return false;

            String payload = new String(
                    Base64.getDecoder().decode(parts[0]), StandardCharsets.UTF_8
            );

            // 1. HMAC integrity check — not tampered
            if (!hmac(payload).equals(parts[1])) return false;

            String[] fields = payload.split("\\|");
            if (fields.length != 3) return false;

            // 2. Expiry check — not older than 3 minutes
            long issuedAt = Long.parseLong(fields[2]);
            if (System.currentTimeMillis() - issuedAt > challengeTtlMinutes * 60_000L) {
                return false;
            }

            // 3. Correct indices match exactly
            Set<Integer> correct = Arrays.stream(fields[1].split(","))
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());

            return correct.equals(new HashSet<>(selected));

        } catch (Exception e) {
            return false;
        }
    }

    // ----------------------------------------------------------------
    // Cloudinary helpers
    // ----------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private List<String> listSubFolders(String parentFolder) throws Exception {
        Map result = cloudinary.api().subFolders(parentFolder, ObjectUtils.emptyMap());
        List<Map> folders = (List<Map>) result.get("folders");
        if (folders == null) return Collections.emptyList();
        return folders.stream()
                .map(f -> (String) f.get("name"))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchImages(String folder, int max) throws Exception {
        Map result = cloudinary.api().resources(ObjectUtils.asMap(
                "type",          "upload",
                "prefix",        folder + "/",
                "resource_type", "image",
                "max_results",   50
        ));

        List<Map> resources = (List<Map>) result.get("resources");
        if (resources == null || resources.isEmpty()) {
            throw new RuntimeException("No images found in Cloudinary folder: " + folder);
        }

        Collections.shuffle(resources);
        return resources.stream()
                .limit(max)
                .map(r -> (String) r.get("secure_url"))
                .collect(Collectors.toList());
    }

    private String hmac(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
        ));
        return Base64.getEncoder()
                .encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}