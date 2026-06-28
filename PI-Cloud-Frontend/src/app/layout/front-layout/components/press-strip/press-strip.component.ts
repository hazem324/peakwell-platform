import { Component } from '@angular/core';
import { NutritionDataService } from '../../../../services/nutrition-data.service';
import { PressLogo } from '../../../../models/nutrition.models';

@Component({
  selector: 'app-press-strip',
  templateUrl: './press-strip.component.html',
  styleUrl: './press-strip.component.scss'
})
export class PressStripComponent {

   logos: PressLogo[];
  constructor(private data: NutritionDataService) {
    this.logos = this.data.pressLogos;
  }

}
