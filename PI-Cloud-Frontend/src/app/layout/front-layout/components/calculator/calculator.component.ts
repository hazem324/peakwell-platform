import { Component } from '@angular/core';
import { CalculatorService } from '../../../../services/calculator.service';
import { ToastServiceService } from '../../../../services/toast-service.service';
import { NutritionResult } from '../../../../models/nutrition.models';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class CalculatorComponent {

  age = 28;
  weight = 68;
  height = 165;
  gender: 'male' | 'female' = 'female';
  selectedActivity = 1.55;
  selectedGoalOffset = 0;
  result: NutritionResult | null = null;

  activities = [
    { label: 'Sedentary (desk job, no exercise)',  value: 1.2   },
    { label: 'Lightly Active (1–3x / week)',        value: 1.375 },
    { label: 'Moderately Active (3–5x / week)',     value: 1.55  },
    { label: 'Very Active (6–7x / week)',           value: 1.725 },
    { label: 'Athlete / Twice-a-day training',      value: 1.9   },
  ];

  goals = [
    { label: 'Lose Weight',  emoji: '🔥', offset: -500 },
    { label: 'Maintain',     emoji: '⚖️', offset: 0    },
    { label: 'Gain Muscle',  emoji: '💪', offset: 300  },
  ];

  perks = [
    { icon: '🎯', text: 'Goal-specific calorie targets' },
    { icon: '💪', text: 'Protein, carb & fat breakdown' },
    { icon: '📊', text: 'BMR & TDEE explained clearly'  },
    { icon: '🍽️', text: 'Suggested meal plan to match'  },
  ];

  constructor(private calcService: CalculatorService, public toastService: ToastServiceService) {}

  calculate(): void {
    this.result = this.calcService.calculate({
      age: this.age, weight: this.weight, height: this.height,
      gender: this.gender,
      activityMultiplier: this.selectedActivity,
      goalOffset: this.selectedGoalOffset,
    });
    this.toastService.show('✅ Your nutrition targets are ready!');
  }

}
