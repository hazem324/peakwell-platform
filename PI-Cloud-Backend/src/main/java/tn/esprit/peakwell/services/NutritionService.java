package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.peakwell.dto.NutritionResponse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;


@Service
public class NutritionService {

    @Value("${nutrition.api.key}")
    private String API_KEY;   

    public NutritionResponse getNutrition(String query) {

        RestTemplate restTemplate = new RestTemplate();

        NutritionResponse result = new NutritionResponse();

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);

            String url = "https://api.nal.usda.gov/fdc/v1/foods/search?query="
                    + encodedQuery + "&pageSize=1&api_key=" + API_KEY;

            Map<String, Object> response =
                    restTemplate.getForObject(url, Map.class);

            if (response == null || !response.containsKey("foods")) {
                return result;
            }

            List<Map<String, Object>> foods =
                    (List<Map<String, Object>>) response.get("foods");

            if (foods == null || foods.isEmpty()) {
                return result;
            }

            Map<String, Object> firstFood = foods.get(0);

            List<Map<String, Object>> nutrients =
                    (List<Map<String, Object>>) firstFood.get("foodNutrients");

            if (nutrients == null) {
                return result;
            }

            // extraction des nutriments
            for (Map<String, Object> nutrient : nutrients) {

                String name = (String) nutrient.get("nutrientName");
                Number value = (Number) nutrient.get("value");

                if (name == null || value == null) continue;

                String lowerName = name.toLowerCase();

                if (lowerName.contains("protein")) {
                    result.setProtein(value.doubleValue());
                }

                else if (lowerName.contains("fat")) {
                    result.setFats(value.doubleValue());
                }

                else if (lowerName.contains("carbohydrate")) {
                    result.setCarbs(value.doubleValue());
                }

                else if (lowerName.contains("energy")) {
                    result.setCalories(value.doubleValue());
                }
            }for (Map<String, Object> nutrient : nutrients) {

                String name = (String) nutrient.get("nutrientName");
                Number value = (Number) nutrient.get("value");

                if (name == null || value == null) continue;

                String lowerName = name.toLowerCase();

                if (lowerName.contains("protein")) {
                    result.setProtein(value.doubleValue());
                }

                else if (lowerName.contains("fat")) {
                    result.setFats(value.doubleValue());
                }

                else if (lowerName.contains("carbohydrate")) {
                    result.setCarbs(value.doubleValue());
                }

                else if (lowerName.contains("energy")) {
                    result.setCalories(value.doubleValue());
                }
            }

        } catch (Exception e) {
            System.out.println("ERROR USDA API: " + e.getMessage());
        }

        return result;
    }
}