package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.ProductDTO;
import tn.esprit.peakwell.dto.ProductRequest;
import tn.esprit.peakwell.services.ProductService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import tn.esprit.peakwell.services.DescriptionAPIService;
import tn.esprit.peakwell.services.NutritionService;
import tn.esprit.peakwell.dto.NutritionResponse;
import java.util.Map;
import java.nio.file.Paths;
import java.nio.file.Path;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.UUID;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/products")
@CrossOrigin("*")
public class ProductController {

    private final ProductService productService;
    private final DescriptionAPIService descriptionService;
    private final NutritionService nutritionService;

    public ProductController(ProductService productService, DescriptionAPIService descriptionService, NutritionService nutritionService) {
        this.productService = productService;
        this.descriptionService = descriptionService;
        this.nutritionService = nutritionService;
    }

    @PostMapping
    public ProductDTO addProduct(@Valid @RequestBody ProductRequest request) {
        return productService.addProduct(request);
    }

    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ProductDTO getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @PutMapping("/{id}")
    public ProductDTO updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok().build();

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("PRODUCT_IN_USE");
        }
    }

    @PostMapping("/generate-description")
    public Map<String, String> generateDescription(@RequestParam String name) {

        String desc = descriptionService.generateDescription(name, "");

        return Map.of("description", desc);
    }

    @PostMapping("/{id}/consume")
    public void consumeStock(@PathVariable Long id, @RequestParam double quantity) {
        productService.consumeStock(id, quantity);
    }

    @GetMapping("/low-stock")
    public List<ProductDTO> getLowStockProducts() {
        return productService.getLowStockProducts();
    }

    @PostMapping("/{id}/restock")
    public void restock(@PathVariable Long id, @RequestParam double quantity) {
        productService.restock(id, quantity);
    }

    @GetMapping("api/nutrition")
    public NutritionResponse getNutrition(@RequestParam String name) {
        return nutritionService.getNutrition(name);
    }

    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductDTO createProductWithImage(
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {

        ProductDTO productDTO = productService.addProduct(request);

        if (image != null && !image.isEmpty()) {

            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();

            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, image.getBytes());

            productService.attachImage(productDTO.getId(), fileName);
        }

        return productService.getProduct(productDTO.getId());
    }

    @PutMapping(value = "/{id}/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductDTO updateProductWithImage(
            @PathVariable Long id,
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {

        ProductDTO productDTO = productService.updateProduct(id, request);

        if (image != null && !image.isEmpty()) {

            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();

            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, image.getBytes());

            productService.attachImage(productDTO.getId(), fileName);
        }

        return productService.getProduct(productDTO.getId());
    }

}