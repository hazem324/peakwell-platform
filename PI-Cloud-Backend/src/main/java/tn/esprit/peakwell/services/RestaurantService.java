package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;

import tn.esprit.peakwell.entities.Restaurant;
import tn.esprit.peakwell.entities.User;

@Service
public class RestaurantService implements IRestaurantService {

    @Override
    public void createRestaurant(User user) {

        if (user.getRestaurant() != null) {
            return;
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setUser(user);

        user.setRestaurant(restaurant);
    }

}