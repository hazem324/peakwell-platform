import { Product } from './product.model';

export interface Ingredient {
  productId: number;
  quantity: number;
  productName: string;
  product: Product;
}

export interface Meal {
  id: number;
  name: string;
  category: string;
  ingredients: Ingredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  tags: string;
  image?: string;
  predictedAllergens?: string[];
  favoriteCount: number;
}