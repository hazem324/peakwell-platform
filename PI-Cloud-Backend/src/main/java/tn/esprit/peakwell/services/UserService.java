package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import tn.esprit.peakwell.dto.AccountStatusUpdateRequest;
import tn.esprit.peakwell.dto.DietitianProfile;
import tn.esprit.peakwell.dto.FailedAttemptsStatsDTO;
import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.RiskUserDTO;
import tn.esprit.peakwell.dto.RoleStatsDTO;
import tn.esprit.peakwell.dto.StudentProfile;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.dto.UserGrowthDTO;
import tn.esprit.peakwell.dto.UserProfile;
import tn.esprit.peakwell.dto.UserStatsDTO;
import tn.esprit.peakwell.entities.ActivityType;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    @Autowired
    private IEmailService emailService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final StudentService studentService;
    private final DietitianService dietitianService;
    private final IFileUploadService fileUploadService;
    private final KeycloakService keycloakService;
    private final RestaurantService restaurantService;
    private final UserActivityService activityService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public User completeProfile(ProfileRequest request, MultipartFile image, MultipartFile certificate) {

        try {

            String keycloakId = authService.getCurrentUserId();

            User user = userRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            String role = request.getRole();

            if (role == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role is required");
            }

            // Validate phone
            if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Phone number is required");
            }

            // Validate address
            if (request.getAddress() == null ||
                    request.getAddress().getStreet() == null ||
                    request.getAddress().getCity() == null ||
                    request.getAddress().getPostalCode() == null ||
                    request.getAddress().getCountry() == null) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Incomplete address");
            }

            user.setPhoneNumber(request.getPhoneNumber());
            user.setAddress(request.getAddress());

            String imageUrl = fileUploadService.uploadFile(image, role, "profile");
            String certificateUrl = fileUploadService.uploadFile(certificate, role, "certificate");

            if ("STUDENT".equals(role)) {

                if (user.getStudent() != null && user.isProfileCompleted()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Student profile already completed");
                }

                if (imageUrl == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Profile image is required");
                }

                user.setImgUrl(imageUrl);
                user.setProfileCompleted(true);

                request.setImgUrl(imageUrl);

                studentService.createStudent(user, request);

            } else if ("DIETITIAN".equals(role)) {

                if (user.getDietitian() != null && user.isProfileCompleted()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Dietitian profile already completed");
                }

                if (imageUrl == null || certificateUrl == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Profile image and certificate are required");
                }

                user.setImgUrl(imageUrl);
                user.setProfileCompleted(true);

                request.setImgUrl(imageUrl);
                request.setCertification(certificateUrl);

                dietitianService.createDietitian(user, request);

            } else if ("RESTAURANT".equals(role)) {

                if (user.getRestaurant() != null && user.isProfileCompleted()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Restaurant profile already completed");
                }

                if (imageUrl == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Profile image is required");
                }

                user.setImgUrl(imageUrl);
                user.setProfileCompleted(true);

                restaurantService.createRestaurant(user);
            } else {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid role");
            }

            User savedUser = userRepository.save(user);

            activityService.log(user, ActivityType.PROFILE_UPDATE,
                    role + " profile completed", "SUCCESS", null);

            return savedUser;

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception ex) {
            ex.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Something went wrong. Please try again later.");
        }
    }

    public UserProfile updateProfile(UpdateProfileRequest request, MultipartFile image, MultipartFile certificate) {

        try {

            String keycloakId = authService.getCurrentUserId();

            User user = userRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            String role = user.getRole().name();

            boolean nameUpdated = false;

            // Update names
            if (request.getFirstName() != null) {
                user.setFirstName(request.getFirstName());
                nameUpdated = true;
            }

            if (request.getLastName() != null) {
                user.setLastName(request.getLastName());
                nameUpdated = true;
            }

            if (nameUpdated) {
                keycloakService.updateUserNames(
                        keycloakId,
                        user.getFirstName(),
                        user.getLastName());
            }

            // Upload files
            String imageUrl = null;
            String certificateUrl = null;

            if (image != null && !image.isEmpty()) {
                imageUrl = fileUploadService.uploadFile(image, role, "profile");
            }

            if (certificate != null && !certificate.isEmpty()) {
                certificateUrl = fileUploadService.uploadFile(certificate, role, "certificate");
            }

            // Update basic user info
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(request.getPhoneNumber());
            }

            if (request.getAddress() != null) {
                user.setAddress(request.getAddress());
            }

            if (imageUrl != null) {
                user.setImgUrl(imageUrl);
            }

            if (certificateUrl != null) {
                request.setCertification(certificateUrl);
            }

            // ROLE HANDLING

            if ("STUDENT".equals(role)) {

                if (user.getStudent() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Student profile not found");
                }

                studentService.updateStudentProfile(user, request);

            } else if ("DIETITIAN".equals(role)) {

                if (user.getDietitian() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Dietitian profile not found");
                }

                dietitianService.updateDietitianProfile(user, request);

            } else if ("RESTAURANT".equals(role)) {

                if (user.getRestaurant() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Restaurant profile not found");
                }

                // restaurantService.updateRestaurantProfile(user, request);

            } else if ("ADMIN".equals(role)) {

                // Admin only updates basic info (name, phone, address, image)

            } else {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid role");
            }

            userRepository.save(user);

            activityService.log(user, ActivityType.PROFILE_UPDATE,
                    role + " profile updated", "SUCCESS", null);

            return mapToUserProfile(user);

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception ex) {
            ex.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Something went wrong while updating profile");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getCurrentUserProfile() {

        String keycloakId = authService.getCurrentUserId();

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = new UserProfile();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setFirstName(user.getFirstName());
        profile.setLastName(user.getLastName());
        profile.setRole(user.getRole().toString());
        profile.setProfileCompleted(user.isProfileCompleted());
        profile.setEnabled(user.isEnabled());
        profile.setPhoneNumber(user.getPhoneNumber());
        profile.setImageUrl(user.getImgUrl());
        profile.setAddress(user.getAddress());

        if (user.getRole().toString().equals("STUDENT")) {
            profile.setStudentProfile(studentService.getStudentProfile(user));
        }

        if (user.getRole().toString().equals("DIETITIAN")) {
            profile.setDietitianProfile(dietitianService.getDietitianProfile(user));
        }

        return profile;
    }

    @Override
    @Transactional
    public void toggleStatus(Long userId, AccountStatusUpdateRequest request) {

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            boolean newStatus = !user.isEnabled();

            if (request.getSubject() == null || request.getSubject().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Subject is required");
            }

            if (request.getMessage() == null || request.getMessage().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Message is required");
            }

            String safeMessage = request.getMessage()
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;");

            Map<String, Object> variables = new HashMap<>();
            variables.put("name", user.getFirstName());
            variables.put("status", newStatus ? "ACTIVE" : "BANNED");
            variables.put("message", safeMessage);
            variables.put("appUrl", frontendUrl);

            // Send email FIRST
            emailService.sendAccountStatusEmail(
                    user.getEmail(),
                    request.getSubject(),
                    "account-status",
                    variables);

            user.setEnabled(newStatus);
            userRepository.save(user);

            String action = newStatus ? "Account enabled" : "Account disabled";
            activityService.log(user, ActivityType.ADMIN_ACTION,
                    action + " by admin", "SUCCESS", null);

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception ex) {
            ex.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex.getMessage());
        }
    }

    @Override
    public List<UserProfile> getAllUsers() {

        List<User> users = userRepository.findAllWithProfiles();

        return users.stream()
                .map(this::mapToUserProfile)
                .toList();
    }

    private UserProfile mapToUserProfile(User user) {

        UserProfile dto = new UserProfile();

        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole().name());
        dto.setProfileCompleted(user.isProfileCompleted());

        dto.setEnabled(user.isEnabled());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setImageUrl(user.getImgUrl());
        dto.setAddress(user.getAddress());

        // Student
        if (user.getStudent() != null) {

            StudentProfile sp = new StudentProfile();

            sp.setWeight(user.getStudent().getWeight() != null
                    ? user.getStudent().getWeight().doubleValue()
                    : null);

            sp.setHeight(user.getStudent().getHeight() != null
                    ? user.getStudent().getHeight().doubleValue()
                    : null);

            sp.setActivityLevel(user.getStudent().getActivityLevel());
            sp.setGoal(user.getStudent().getGoal());

            dto.setStudentProfile(sp);
        }

        if (user.getDietitian() != null) {

            DietitianProfile dp = new DietitianProfile();

            dp.setSpecialization(user.getDietitian().getSpecialization());
            dp.setExperienceYears(user.getDietitian().getExperienceYears());
            dp.setConsultationPrice(user.getDietitian().getConsultationPrice());
            dp.setLinkUrl(user.getDietitian().getLinkUrl());
            dp.setCertificateUrl(user.getDietitian().getCertification());

            dto.setDietitianProfile(dp);
        }

        return dto;
    }

    @Override
    public UserStatsDTO getGlobalStats() {
        try {
            long total = userRepository.count();

            if (total == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No users found");
            }

            long active = userRepository.countByEnabledTrue();
            long locked = userRepository.countByAccountLockedTrue();
            long completed = userRepository.countByProfileCompletedTrue();

            double completionRate = (completed * 100.0 / total);

            return new UserStatsDTO(total, active, locked, completionRate);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error while fetching global stats");
        }
    }

    @Override
    public List<RoleStatsDTO> getRoleStats() {
        try {
            List<Object[]> results = userRepository.countUsersByRole();

            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No role statistics found");
            }

            return results.stream()
                    .map(obj -> new RoleStatsDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();

        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error while fetching role statistics");
        }
    }

    @Override
    public List<UserGrowthDTO> getGrowth() {
        try {
            List<Object[]> results = userRepository.getUserGrowth();

            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No growth data found");
            }

            return results.stream()
                    .map(obj -> new UserGrowthDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();

        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error while fetching growth statistics");
        }
    }

    @Override
    public List<RiskUserDTO> getTopRiskUsers() {
        try {
            List<Object[]> results = userRepository.getTopRiskUsers(PageRequest.of(0, 5));

            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No risky users found");
            }

            return results.stream()
                    .map(obj -> new RiskUserDTO(
                            (String) obj[0],
                            ((Number) obj[1]).intValue()))
                    .toList();

        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination parameters");
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error while fetching risky users");
        }
    }

    @Override
    public FailedAttemptsStatsDTO getFailedAttemptsStats() {
        try {
            Object resultObj = userRepository.getFailedAttemptsStats();

            if (resultObj == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No failed attempts data found");
            }

            Object[] result = (Object[]) resultObj;

            return new FailedAttemptsStatsDTO(
                    ((Number) result[0]).longValue(),
                    ((Number) result[1]).longValue(),
                    ((Number) result[2]).longValue());

        } catch (ClassCastException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid data format for failed attempts");
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error while fetching failed attempts stats");
        }
    }
}