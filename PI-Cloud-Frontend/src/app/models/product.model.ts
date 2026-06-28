import { UnitType } from './UnitType.model';

export interface Product {
  id: number;
  name: string;
  description: string;

  calories: number;
  protein: number;
  carbs: number;
  fats: number;

  category_Product: 'PROTEIN' | 'CARB' | 'FAT' | 'VEGETABLE' | 'DAIRY';

  stock: number;
  unit: string;
  image?: string;

  minStock: number;

  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface ProductRequest {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;

  category_Product: string;

  stock: number;
  unit: UnitType;
  image?: string;

  minStock: number;
}