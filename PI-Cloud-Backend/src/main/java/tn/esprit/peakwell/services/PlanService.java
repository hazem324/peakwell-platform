package tn.esprit.peakwell.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import tn.esprit.peakwell.dto.DailyPlanDTO;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import org.springframework.security.oauth2.jwt.Jwt;

@Service
public class PlanService {

    @Autowired private UserRepository userRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private MealRepository mealRepository;
    @Autowired private DailyPlanRepository dailyPlanRepository;
    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MedicalProfileRepository medicalProfileRepository;


    private List<String> getCurrentAllergies(Student student) {

        if (student == null || student.getId() == null) {
            return Collections.emptyList();
        }

        return medicalProfileRepository.findByStudentId(student.getId())
                .map(MedicalProfile::getAllergies)
                .orElse(Collections.emptyList());
    }


    public DailyPlanDTO generateTodayPlan() {

        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String email = jwt.getClaim("email");

        if (email == null) {
            email = jwt.getClaim("preferred_username");
        }

        User user = userRepository.findByEmail(email);

        Student student = studentRepository.findByUser(user);

        // CHECK SI PLAN EXISTE
        Optional<DailyPlan> existingPlan =
                dailyPlanRepository.findByUserIdAndDate(user.getId(), LocalDate.now());

        if (existingPlan.isPresent()) {

            DailyPlan plan = existingPlan.get();

            String currentAllergies = buildAllergiesHash(student);

            boolean sameProfile =
                Objects.equals(plan.getGoal(), student.getGoal()) &&
                Objects.equals(plan.getActivityLevel(), student.getActivityLevel()) &&
                plan.getWeight() == student.getWeight() &&
                plan.getHeight() == student.getHeight() &&
                Objects.equals(plan.getAllergiesHash(), currentAllergies);

            if (sameProfile) {
                // réutiliser plan
                return DailyPlanDTO.builder()
                        .id(plan.getId())
                        .breakfast(plan.getBreakfast())
                        .lunch(plan.getLunch())
                        .dinner(plan.getDinner())
                        .totalCalories(plan.getTotalCalories())
                        .targetCalories(plan.getTargetCalories())
                        .status("EXISTING")
                        .build();
            }

            // profil changé → supprimer ancien plan
            dailyPlanRepository.delete(plan);
        }

        // SINON GENERATE
        List<Meal> safeMeals = mealRepository.findAll().stream()
                .filter(meal -> isSafe(meal, student))
                .toList();

        DailyPlan plan = generateSmartPlanEntity(user, student, safeMeals);

        return DailyPlanDTO.builder()
                .id(plan.getId())
                .breakfast(plan.getBreakfast())
                .lunch(plan.getLunch())
                .dinner(plan.getDinner())
                .totalCalories(plan.getTotalCalories())
                .targetCalories(plan.getTargetCalories())
                .status("GENERATED")
                .build();
    }

    private DailyPlan generateSmartPlanEntity(User user, Student student, List<Meal> meals) {

        double target = calculateCalories(student);

        Meal breakfast = selectBest(meals, "BREAKFAST", target * 0.25);
        Meal lunch = selectBest(meals, "LUNCH", target * 0.40);
        Meal dinner = selectBest(meals, "DINNER", target * 0.35);

        DailyPlan plan = new DailyPlan();
        plan.setUserId(user.getId());
        plan.setBreakfast(breakfast);
        plan.setLunch(lunch);
        plan.setDinner(dinner);
        double totalCalories =
        (breakfast != null ? breakfast.getTotalCalories() : 0) +
        (lunch != null ? lunch.getTotalCalories() : 0) +
        (dinner != null ? dinner.getTotalCalories() : 0);
        plan.setTotalCalories(totalCalories);
        plan.setTargetCalories(target);  
        plan.setStatus("GENERATED");
        plan.setDate(LocalDate.now());
        plan.setGoal(student.getGoal());
        plan.setActivityLevel(student.getActivityLevel());
        plan.setWeight(student.getWeight());
        plan.setHeight(student.getHeight());
        plan.setAllergiesHash(buildAllergiesHash(student));

        return dailyPlanRepository.save(plan);
    }

    private boolean isSafe(Meal meal, Student student) {

        List<String> allergens = meal.getPredictedAllergens();

        if (allergens == null || allergens.isEmpty()) {
            return true;
        }

        List<String> userAllergies = getCurrentAllergies(student)
                .stream()
                .map(String::toUpperCase)
                .toList();

        return allergens.stream()
                .map(String::toUpperCase)
                .noneMatch(userAllergies::contains);
    }


    private double calculateCalories(Student student) {

        double weight = student.getWeight();

        double calories = weight * 22;

        switch (student.getActivityLevel().toUpperCase()) {
            case "LOW":
                calories *= 1.2;
                break;
            case "MEDIUM":
                calories *= 1.55;
                break;
            case "HIGH":
                calories *= 1.75;
                break;
            default:
                calories *= 1.3;
        }

        switch (student.getGoal().toUpperCase()) {
            case "LOSE_WEIGHT":
                calories -= 500;
                break;
            case "GAIN_WEIGHT":
                calories += 500;
                break;
        }

        return calories;
    }


    private Meal selectBest(List<Meal> meals, String category, double targetCalories) {

        return meals.stream()
                .filter(m -> m != null && m.getCategory().equalsIgnoreCase(category))
                .min(Comparator.comparing(m ->
                        Math.abs(m.getTotalCalories() - targetCalories)))
                .orElse(null);
    }

    private String buildAllergiesHash(Student student) {

        List<String> allergies = getCurrentAllergies(student);

        if (allergies == null || allergies.isEmpty()) {
            return "";
        }

        return allergies.stream()
                .sorted()
                .map(String::toUpperCase)
                .reduce((a, b) -> a + "," + b)
                .orElse("");
    }

    
}