package tn.esprit.peakwell.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import tn.esprit.peakwell.dto.ProductDTO;
import tn.esprit.peakwell.dto.ProductRequest;
import tn.esprit.peakwell.entities.Category_Product;
import tn.esprit.peakwell.entities.Product;
import tn.esprit.peakwell.entities.StockStatus;
import tn.esprit.peakwell.repositories.IngredientRepository;
import tn.esprit.peakwell.repositories.ProductRepository;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.http.HttpStatus;

import tn.esprit.peakwell.entities.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import tn.esprit.peakwell.repositories.UserRepository;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final IngredientRepository ingredientRepository;

    private Product mapToEntity(ProductRequest dto) {

        Product p = new Product();

        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setCalories(dto.getCalories());
        p.setProtein(dto.getProtein());
        p.setCarbs(dto.getCarbs());
        p.setFats(dto.getFats());
        p.setCategory_Product(dto.getCategory_Product());
        p.setStock(dto.getStock());
        p.setUnit(dto.getUnit());
        p.setImage(dto.getImage());
        p.setMinStock(dto.getMinStock());

        return p;
    }

    private ProductDTO mapToDTO(Product product) {

        ProductDTO dto = new ProductDTO();

        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setCalories(product.getCalories());
        dto.setProtein(product.getProtein());
        dto.setCarbs(product.getCarbs());
        dto.setFats(product.getFats());
        dto.setCategory_Product(product.getCategory_Product());
        dto.setStock(product.getStock());
        dto.setUnit(product.getUnit());
        dto.setImage(product.getImage());
        dto.setStockStatus(
                product.getStockStatus() != null
                        ? product.getStockStatus().name()
                        : "IN_STOCK"
        );
        dto.setMinStock(product.getMinStock());

        return dto;
    }

    public ProductService(ProductRepository productRepository, EmailService emailService, IngredientRepository ingredientRepository) {
        this.productRepository = productRepository;
        this.emailService = emailService;
        this.ingredientRepository = ingredientRepository;
    }

    public ProductDTO addProduct(ProductRequest request) {

        Product product = mapToEntity(request);

        // récupérer user connecté
        String userId = getCurrentUserId();

        product.setUserId(userId);

        product.setMinStock(getDefaultMinStock(product.getCategory_Product()));
        updateStockStatus(product);

        Product saved = productRepository.save(product);

        return mapToDTO(saved);
    }

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public ProductDTO getProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return mapToDTO(product);
    }

    public ProductDTO updateProduct(Long id, ProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        StockStatus oldStatus = product.getStockStatus();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCalories(request.getCalories());
        product.setProtein(request.getProtein());
        product.setCarbs(request.getCarbs());
        product.setFats(request.getFats());
        product.setCategory_Product(request.getCategory_Product());
        product.setStock(request.getStock());
        product.setUnit(request.getUnit());


        product.setMinStock(request.getMinStock());

        updateStockStatus(product);

        if (oldStatus != product.getStockStatus()
                && product.getStockStatus() != StockStatus.IN_STOCK) {

            checkAndSendStockAlert(product);
        }

        Product updated = productRepository.save(product);

        return mapToDTO(updated);
    }

    public void deleteProduct(Long id) {

        if (ingredientRepository.existsByProductId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ce produit est utilisé dans un repas"
            );
        }

        productRepository.deleteById(id);
    }

    private void updateStockStatus(Product product) {
        if (product.getStock() == 0) {
            product.setStockStatus(StockStatus.OUT_OF_STOCK);
            //checkAndSendStockAlert(product);
        } else if (product.getStock() <= product.getMinStock()) {
            product.setStockStatus(StockStatus.LOW_STOCK);
            //checkAndSendStockAlert(product);
        } else {
            product.setStockStatus(StockStatus.IN_STOCK);
        }
    }

    public void consumeStock(Long productId, double quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStock() < quantity) {
            throw new RuntimeException("Stock insuffisant !");
        }

        product.setStock(product.getStock() - quantity);

        updateStockStatus(product);

        productRepository.save(product);
    }

    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findAll()
                .stream()
                .filter(p -> p.getStockStatus() == StockStatus.LOW_STOCK)
                .map(this::mapToDTO)
                .toList();
    }

    private double getDefaultMinStock(Category_Product category) {
        return switch (category) {
            case PROTEIN -> 500;
            case CARB -> 1000;
            case FAT -> 300;
            case VEGETABLE -> 300;
            case DAIRY -> 400;
        };
    }

    public void restock(Long productId, double quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setStock(product.getStock() + quantity);

        updateStockStatus(product);

        productRepository.save(product);
    }

    public void attachImage(Long productId, String fileName) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setImage(fileName);
        productRepository.save(product);
    }
    @Autowired
    private UserRepository userRepository;

    private void checkAndSendStockAlert(Product product) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();

        // récupérer les infos depuis le token
        String keycloakId = jwt.getSubject(); // sub
        String emailFromToken = jwt.getClaim("email"); // email

        // récupérer le user depuis DB
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String email = user.getEmail();

        if (product.getStock() == 0) {

            emailService.sendOutOfStockAlert(email, product.getName());

        } else if (product.getStock() <= product.getMinStock()) {

            emailService.sendLowStockAlert(email, product.getName(), product.getStock());
        }
    }

    private String getCurrentUserId() {
        JwtAuthenticationToken token =
                (JwtAuthenticationToken) SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        return token.getToken().getSubject();
    }

}