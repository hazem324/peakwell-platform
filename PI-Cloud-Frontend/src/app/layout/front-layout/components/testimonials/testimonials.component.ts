import { Component } from '@angular/core';
import { NutritionDataService } from '../../../../services/nutrition-data.service';
import { Testimonial } from '../../../../models/nutrition.models';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent {

  testimonials: Testimonial[];
  stars = [1, 2, 3, 4, 5];

  constructor(private data: NutritionDataService) {
    this.testimonials = this.data.testimonials;
  }

}
