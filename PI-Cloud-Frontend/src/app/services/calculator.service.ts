import { Injectable } from '@angular/core';
import { CalcInput, NutritionResult } from '../models/nutrition.models';


@Injectable({
  providedIn: 'root'
})
export class CalculatorService {

    calculate(input: CalcInput): NutritionResult {
    let bmr: number;
    if (input.gender === 'female') {
      bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age - 161;
    } else {
      bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;
    }
    const tdee    = Math.round(bmr * input.activityMultiplier);
    const target  = tdee + input.goalOffset;
    const protein = Math.max(Math.round(input.weight * 1.6), Math.round(target * 0.30 / 4));
    const fat     = Math.round(target * 0.28 / 9);
    const carbs   = Math.max(50, Math.round((target - protein * 4 - fat * 9) / 4));
    return { calories: target, bmr: Math.round(bmr), tdee, protein, carbs, fat };
  }
}
