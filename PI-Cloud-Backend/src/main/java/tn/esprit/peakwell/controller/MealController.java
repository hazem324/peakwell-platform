package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.MealDTO;
import tn.esprit.peakwell.dto.MealRequest;
import tn.esprit.peakwell.services.MealService;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import org.springframework.http.MediaType;
import java.util.UUID;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/meals")
@CrossOrigin("*")
public class MealController {

    private final MealService mealService;

    public MealController(MealService mealService) {
        this.mealService = mealService;
    }

    // CREATE
    @PostMapping
    public MealDTO createMeal(@Valid @RequestBody MealRequest request) {
        return mealService.createMeal(request);
    }

    // GET ALL
    @GetMapping
    public List<MealDTO> getAllMeals() {
        return mealService.getAllMeals();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public MealDTO getMeal(@PathVariable Long id) {
        return mealService.getMeal(id);
    }

    @GetMapping("/category/{cat}")
    public List<MealDTO> getByCategory(@PathVariable String cat) {
        return mealService.getMealsByCategory(cat);
    }

    @GetMapping("/tag/{tag}")
    public List<MealDTO> getByTag(@PathVariable String tag) {
        return mealService.getMealsByTags(tag);
    }

    @PutMapping("/{id}")
    public MealDTO updateMeal(
            @PathVariable Long id,
            @RequestBody MealRequest request) {

        return mealService.updateMeal(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteMeal(@PathVariable Long id) {
        mealService.deleteMeal(id);
    }

    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MealDTO createMealWithImage(
            @RequestPart("meal") MealRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {

        MealDTO mealDTO = mealService.createMeal(request);

        if (image != null && !image.isEmpty()) {

            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();

            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, image.getBytes());

            mealService.attachImage(mealDTO.getId(), fileName);
        }

        return mealService.getMeal(mealDTO.getId());
    }

    @PutMapping(value = "/{id}/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MealDTO updateMealWithImage(
            @PathVariable Long id,
            @RequestPart("meal") MealRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws Exception {

        MealDTO mealDTO = mealService.updateMeal(id, request);

        if (image != null && !image.isEmpty()) {

            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();

            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, image.getBytes());

            mealService.attachImage(mealDTO.getId(), fileName);
        }

        return mealService.getMeal(mealDTO.getId());
    }
}