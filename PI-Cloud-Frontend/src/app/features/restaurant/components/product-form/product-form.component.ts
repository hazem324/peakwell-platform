import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductService } from '../../../../services/product.service';
import { HttpClient } from '@angular/common/http';
import { NutritionService } from '../../../../services/nutrition.service';
import { DescriptionService } from '../../../../services/description.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {

  popupMessage: string = '';
  showPopupFlag = false;

  showPopup(message: string) {
    this.popupMessage = message;
    this.showPopupFlag = true;

    setTimeout(() => {
      this.showPopupFlag = false;
    }, 3000);
  }

  @Input() productData: any;
  @Input() isEditMode: boolean = false;
  @Output() closeForm = new EventEmitter<void>();
  @Output() success = new EventEmitter<'add' | 'edit'>();
  @Output() error = new EventEmitter<void>();

  categories = [
  { value: 'PROTEIN', label: 'Sources de protéines' },
  { value: 'CARB', label: 'Glucides' },
  { value: 'FAT', label: 'Matières grasses' },
  { value: 'VEGETABLE', label: 'Légumes' },
  { value: 'DAIRY', label: 'Produits laitiers' }
  ];

  loading = false;
  successMessage: string = '';
  loadingNutrition = false;

  product: any = {
    name: '',
    category_Product: '', 
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    stock: 0,
    unit: '',
    description: ''
  };

  selectedFile!: File;

  constructor(private productService: ProductService, private http: HttpClient, private nutritionService: NutritionService, private descriptionService: DescriptionService) {}

  ngOnInit() {
    if (this.productData) {
      this.product = { ...this.productData };
    }
  }

  submit() {

    const formData = new FormData();

    const productPayload = {
      name: this.product.name,
      description: this.product.description,
      calories: this.product.calories,
      protein: this.product.protein,
      carbs: this.product.carbs,
      fats: this.product.fats,
      category_Product: this.product.category_Product,
      stock: this.product.stock,
      unit: this.product.unit,
      minStock: this.product.minStock ?? 0
    };

    formData.append(
      'product',
      new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
    );

    // ajouter image si existe
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.isEditMode && this.product.id) {

      // UPDATE WITH IMAGE
      this.productService.updateWithImage(this.product.id, formData).subscribe({
        next: () => {
          this.closeForm.emit();
          this.success.emit('edit');
        },
        error: (err) => {
          console.error("❌ ERROR ", err);
          const message =
            typeof err?.error === 'string'
              ? err.error // 🔥 cas string direct
              : err?.error?.error || 
                err?.error?.message || 
                "Erreur lors de l'opération";
              this.showPopup(message); // 🔥 THIS WAS MISSING
          }
      });

    } else {

      // CREATE WITH IMAGE
      this.productService.createWithImage(formData).subscribe({
        next: () => {
          this.resetForm();
          this.closeForm.emit();
          this.success.emit('add');
        },
        error: (err) => {
          console.error("❌ ERROR ", err);

          const message =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.error ||
                err?.error?.message ||
                "Erreur";

          this.showPopup(message);
        }
      });

    }
  }

  resetForm() {
    this.product = {
      name: '',
      category_Product: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      stock: 0,
      unit: '',
      description: ''
    };
  }

  close() {
    this.closeForm.emit();
  }

  generateDescription() {
    if (!this.product.name) return;

    this.loading = true;

    this.descriptionService.generate(this.product.name)
      .subscribe({
        next: (res) => {
          this.product.description = res.description;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  autoFillNutrition() {
    if (!this.product.name) return;

    this.loadingNutrition = true;

    this.nutritionService.getNutrition(this.product.name)
      .subscribe({
        next: (res) => {
          this.product.calories = res.calories;
          this.product.protein = res.protein;
          this.product.carbs = res.carbs;
          this.product.fats = res.fats;

          this.loadingNutrition = false;

        },
        error: (err) => {
          console.error(err);
          this.loadingNutrition = false;
        }
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // PREVIEW IMAGE 
  getImagePreview(): string | null {

    if (this.selectedFile) {
      return URL.createObjectURL(this.selectedFile);
    }

    if (this.product?.image) {
      return 'http://localhost:8090/peakwell/uploads/' + this.product.image;
    }

    return null;
  }
}