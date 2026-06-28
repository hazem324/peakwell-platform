export interface Meal {
  id: number;
  name: string;
  category: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  image: string;
}

export interface Plan {
  id: number;
  userId: number;
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  totalCalories: number;
  status: string;
  targetCalories: number;
}