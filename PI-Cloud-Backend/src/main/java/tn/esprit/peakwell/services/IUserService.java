package tn.esprit.peakwell.services;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import tn.esprit.peakwell.dto.AccountStatusUpdateRequest;
import tn.esprit.peakwell.dto.FailedAttemptsStatsDTO;
import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.RiskUserDTO;
import tn.esprit.peakwell.dto.RoleStatsDTO;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.dto.UserGrowthDTO;
import tn.esprit.peakwell.dto.UserProfile;
import tn.esprit.peakwell.dto.UserStatsDTO;
import tn.esprit.peakwell.entities.User;

public interface IUserService {

    User completeProfile(ProfileRequest request, MultipartFile image, MultipartFile certificate);
    UserProfile  updateProfile( UpdateProfileRequest request, MultipartFile image,  MultipartFile certificate);
    UserProfile getCurrentUserProfile();
    List<UserProfile> getAllUsers();
    void toggleStatus(Long userId, AccountStatusUpdateRequest request);

    UserStatsDTO getGlobalStats();
    List<RoleStatsDTO> getRoleStats();
    List<UserGrowthDTO> getGrowth();
    List<RiskUserDTO> getTopRiskUsers();
    FailedAttemptsStatsDTO getFailedAttemptsStats();

}