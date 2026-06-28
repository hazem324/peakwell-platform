import { Component } from '@angular/core';
import { NutritionDataService } from '../../../../services/nutrition-data.service';
import { Feature } from '../../../../models/nutrition.models';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {

  features: Feature[];
  constructor(private data: NutritionDataService) {
    this.features = this.data.features;
  }

}
