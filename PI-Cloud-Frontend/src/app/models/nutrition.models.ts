export interface Recipe {
  id: number;
  title: string;
  description: string;
  emoji: string;
  bgGradient: string;
  category: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'vegan' | 'quick';
  tag: string;
  timeMinutes: number;
  calories: number;
  servings: number;
  macros: MacroInfo;
  badges: string[];
  featured?: boolean;
}

export interface MacroInfo {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Testimonial {
  id: number;
  name: string;
  memberDuration: string;
  text: string;
  result: string;
  resultEmoji: string;
  avatarEmoji: string;
  avatarBg: string;
  stars: number;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  emoji: string;
  bgGradient: string;
  featured?: boolean;
}

export interface MealPlanDay {
  label: string;
  emoji: string;
  meals: DayMeal[];
  featured?: boolean;
}

export interface DayMeal {
  time: string;
  emoji: string;
  name: string;
  calories: number;
  protein: number;
}

export interface NutritionResult {
  calories: number;
  bmr: number;
  tdee: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Feature {
  icon: string;
  iconBg: 'terra' | 'sage' | 'warm';
  title: string;
  description: string;
}

export interface PressLogo {
  name: string;
}

export interface CalcInput {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityMultiplier: number;
  goalOffset: number;
}