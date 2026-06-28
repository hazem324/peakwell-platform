import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ProductService } from '../../../../services/product.service';

type IngredientForm = {
  productId: number;
  quantity: number;
};

@Component({
  selector: 'app-meal-form',
  templateUrl: './meal-form.component.html',
  styleUrls: ['./meal-form.component.scss']
})
export class MealFormComponent implements OnInit, OnChanges {

  products: any[] = [];

  selectedFile: File | null = null; 

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  @Input() meal: any;
  @Input() isEditMode: boolean = false;

  initialQuantities: { [productId: number]: number } = {};

  formMeal = {
    name: '',
    category: 'LUNCH',
    ingredients: [] as IngredientForm[]
  };

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['meal']) {

      // RESET IMAGE 
      this.selectedFile = null;

      if (this.meal) {

        this.formMeal = {
          name: this.meal.name || '',
          category: this.meal.category || 'LUNCH',
          ingredients: []
        };

        this.initialQuantities = {};
        this.mapIngredients();

      } else {
        // MODE ADD RESET
        this.formMeal = {
          name: '',
          category: 'LUNCH',
          ingredients: []
        };
      }
    }
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products = res;
        this.mapIngredients();
      },
      error: (err) => console.error(err)
    });
  }

  mapIngredients() {

    if (!this.meal || !this.products.length) return;

    const mapped: (IngredientForm | null)[] = (this.meal.ingredients || [])
      .map((i: any) => {

        const product = this.products.find(
          (p: any) =>
            p.name.trim().toLowerCase() ===
            i.productName.trim().toLowerCase()
        );

        if (!product) return null;

        const quantity = Number(i.quantity);

        this.initialQuantities[product.id] = quantity;

        return {
          productId: product.id,
          quantity
        };
      });

    this.formMeal.ingredients = mapped.filter(
      (i: IngredientForm | null): i is IngredientForm => i !== null
    );

    this.formMeal = { ...this.formMeal };
  }

  isSelected(product: any): boolean {
    return this.formMeal.ingredients.some(
      (i: IngredientForm) => i.productId === product.id
    );
  }

  toggleProduct(product: any) {

    const index = this.formMeal.ingredients.findIndex(
      (i: IngredientForm) => i.productId === product.id
    );

    if (index > -1) {
      this.formMeal.ingredients.splice(index, 1);
    } else {
      this.formMeal.ingredients.push({
        productId: product.id,
        quantity: 100
      });

      this.initialQuantities[product.id] = 0;
    }

    this.formMeal = { ...this.formMeal };
  }

  getQuantity(product: any): number {
    const item = this.formMeal.ingredients.find(
      (i: IngredientForm) => i.productId === product.id
    );
    return item ? item.quantity : 0;
  }

  getRemainingStock(product: any): number {
    const initial = this.initialQuantities[product.id] || 0;

    return this.isEditMode
      ? product.stock + initial
      : product.stock;
  }

  updateQuantity(product: any, event: any) {

    let value = Number(event.target.value);
    const max = this.getRemainingStock(product);

    if (value > max) value = max;
    if (value < 0) value = 0;

    const item = this.formMeal.ingredients.find(
      (i: IngredientForm) => i.productId === product.id
    );

    if (item) item.quantity = value;
  }

  trackByProductId(index: number, product: any) {
    return product.id;
  }

  onClose() {
    this.close.emit();
  }

  // SUBMIT FINAL (ADD + EDIT)
  onSubmit() {

    const formData = new FormData();

    const mealPayload = {
      name: this.formMeal.name,
      category: this.formMeal.category,
      ingredients: this.formMeal.ingredients.map((ing: any) => ({
        productId: ing.product?.id ?? ing.productId,
        quantity: Number(ing.quantity)
      }))
    };

    formData.append(
      'meal',
      new Blob([JSON.stringify(mealPayload)], {
        type: 'application/json'
      })
    );

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.save.emit(formData);
  }

  // IMAGE SELECT
  onFileSelected(event: any) {

    const file = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      console.log("NEW IMAGE:", file.name);
    }
  }

  // PREVIEW IMAGE 
  getImagePreview(): string | null {

    if (this.selectedFile) {
      return URL.createObjectURL(this.selectedFile);
    }

    if (this.meal?.image) {
      return 'http://localhost:8090/peakwell/uploads/' + this.meal.image;
    }

    return null;
  }
}