package tn.esprit.peakwell.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import tn.esprit.peakwell.dto.DietitianProfile;
import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.entities.Dietitian;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.entities.Role;
import tn.esprit.peakwell.repositories.ConsultationRatingRepository;
import tn.esprit.peakwell.repositories.DietitianRepository;
import tn.esprit.peakwell.repositories.UserRepository;


import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
public class DietitianService implements IDietitianService{

    @Autowired
    DietitianRepository dietitianRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    ConsultationRatingRepository ratingRepository;


    @Override
    public void createDietitian(User user, ProfileRequest request) {

        Dietitian dietitian = user.getDietitian();

        if (dietitian == null) {
            dietitian = new Dietitian();
            dietitian.setUser(user);
        }

        dietitian.setSpecialization(request.getSpecialization());
        dietitian.setCertification(request.getCertification()); // 🔗 certificate URL
        dietitian.setLinkUrl(request.getLinkUrl());
        dietitian.setExperienceYears(request.getExperienceYears());
        dietitian.setConsultationPrice(request.getConsultationPrice());

        user.setDietitian(dietitian);
    }

    @Override
    public void updateDietitianProfile(User user, UpdateProfileRequest request) {

        Dietitian dietitian = user.getDietitian();

        if (dietitian == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Dietitian profile not found");
        }

        //  Update ONLY dietitian fields

        if (request.getSpecialization() != null) {
            dietitian.setSpecialization(request.getSpecialization());
        }

        if (request.getCertification() != null) {
            dietitian.setCertification(request.getCertification());
        }

        if (request.getLinkUrl() != null) {
            dietitian.setLinkUrl(request.getLinkUrl());
        }

        if (request.getExperienceYears() != null) {
            if (request.getExperienceYears() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid experience years");
            }
            dietitian.setExperienceYears(request.getExperienceYears());
        }

        if (request.getConsultationPrice() != null) {
            if (request.getConsultationPrice() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid consultation price");
            }
            dietitian.setConsultationPrice(request.getConsultationPrice());
        }

    }


    @Override
    public DietitianProfile getDietitianProfile(User user) {

        Dietitian dietitian = user.getDietitian();

        if (dietitian == null) {
            return null;
        }

        DietitianProfile dp = new DietitianProfile();
        dp.setSpecialization(dietitian.getSpecialization());
        dp.setExperienceYears(dietitian.getExperienceYears());
        dp.setConsultationPrice(dietitian.getConsultationPrice());
        dp.setLinkUrl(dietitian.getLinkUrl());
        dp.setCertificateUrl(dietitian.getCertification());

        return dp;
    }

    @Override
    public List<Map<String, Object>> getAllDietitians() {
        return userRepository.findByRole(Role.DIETITIAN).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",        u.getId());
            String firstName = u.getFirstName() != null ? u.getFirstName() : "";
            String lastName  = u.getLastName()  != null ? u.getLastName()  : "";
            m.put("firstName", firstName);
            m.put("lastName",  lastName);
            m.put("email",     u.getEmail());
            m.put("imageUrl",  u.getImgUrl());
            // Build address string: street, city, state (no postal code, no country)
            String address = null;
            if (u.getAddress() != null) {
                tn.esprit.peakwell.entities.Address a = u.getAddress();
                StringBuilder sb = new StringBuilder();
                if (a.getStreet() != null && !a.getStreet().isBlank()) sb.append(a.getStreet()).append(", ");
                if (a.getCity()   != null && !a.getCity().isBlank())   sb.append(a.getCity()).append(", ");
                if (a.getState()  != null && !a.getState().isBlank())  sb.append(a.getState());
                address = sb.toString().replaceAll(",\\s*$", "").trim();
                if (address.isEmpty()) address = null;
            }
            m.put("address", address);
            Dietitian d = u.getDietitian();
            if (d != null) {
                m.put("specialization",    d.getSpecialization());
                m.put("certification",     d.getCertification());
                m.put("experienceYears",   d.getExperienceYears());
                m.put("consultationPrice", d.getConsultationPrice());
                m.put("linkUrl",           d.getLinkUrl());
                String fullName = (firstName + " " + lastName).trim();
                Double avg   = ratingRepository.findAverageRatingByDoctorName(fullName);
                Long   count = ratingRepository.countRatingsByDoctorName(fullName);
                m.put("averageRating", avg   != null ? Math.round(avg * 10.0) / 10.0 : null);
                m.put("totalRatings",  count != null ? count : 0L);
            } else {
                m.put("specialization",    null);
                m.put("certification",     null);
                m.put("experienceYears",   null);
                m.put("consultationPrice", null);
                m.put("linkUrl",           null);
                m.put("averageRating",     null);
                m.put("totalRatings",      0L);
            }
            return m;
        }).collect(Collectors.toList());
    }
}