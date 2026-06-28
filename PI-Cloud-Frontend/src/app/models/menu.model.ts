import { Meal } from './meal.model';

export interface Menu {
  id: number;
  date: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}