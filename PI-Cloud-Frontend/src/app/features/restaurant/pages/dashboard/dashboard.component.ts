import { Component } from '@angular/core';
import { ProductService } from '../../../../services/product.service';
import { MealService } from '../../../../services/meal.service'; 
import { ViewChild } from '@angular/core';
import { MealListComponent } from '../../components/meal-list/meal-list.component'; 
import { ProductListComponent } from '../../components/product-list/product-list.component'; 

type ViewType = 'products' | 'meals' | 'menus';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  deleteType: 'product' | 'meal' | null = null;

  @ViewChild(MealListComponent) mealList!: MealListComponent;
  @ViewChild(ProductListComponent) productList!: ProductListComponent;

  constructor(
    private productService: ProductService,
    private mealService: MealService 
  ) {}

  currentView: ViewType = 'products';

  /* PRODUCTS */
  selectedProductId: number | null = null;

  /* MEALS */
  selectedMealId: number | null = null;
  selectedMeal: any = null;

  showDeleteConfirm = false;
  showForm = false;

  isEditMode = false;

  selectedProduct: any = null;

  setView(view: ViewType) {
    this.currentView = view;
    this.showForm = false;
  }

  openForm() {
    this.isEditMode = false;
    this.selectedProduct = null;
    this.selectedMeal = null;
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  openEditForm(product: any) {
    this.selectedProduct = product;
    this.isEditMode = true;
    this.showForm = true;
  }

  openEditMeal(meal: any) {
    this.selectedMeal = meal;
    this.isEditMode = true;
    this.showForm = true;
  }

  confirmDelete(id: number) {
    this.selectedProductId = id;
    this.deleteType = 'product';
    this.showDeleteConfirm = true;
  }

  confirmDeleteMeal(id: number) {
    this.selectedMealId = id;
    this.deleteType = 'meal';
    this.showDeleteConfirm = true;
  }

  confirmDeleteAction() {
    if (this.deleteType === 'product') {
      this.deleteProduct();
    } 
    else if (this.deleteType === 'meal') {
      this.deleteMeal();
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  deleteProduct() {
    if (!this.selectedProductId) return;

    this.productService.delete(this.selectedProductId).subscribe({
      next: () => {
        this.showDeleteConfirm = false;

        this.popupMessage = "Produit supprimé avec succès";
        this.isSuccess = true;
        this.showPopup = true;

        // refresh list
        if (this.productList) {
          this.productList.reloadProducts();
        }
      },

      error: (err) => {
        console.error("DELETE ERROR:", err);

        this.showDeleteConfirm = false;

        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.error ||
              err?.error?.message ||
              "Erreur lors de la suppression";

        this.popupMessage = message; 
        this.isSuccess = false;
        this.showPopup = true;
      }
    });
  }

  deleteMeal() {
    if (!this.selectedMealId) return;

    this.mealService.delete(this.selectedMealId).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.popupMessage = "Repas supprimé avec succès";
        this.isSuccess = true;
        this.showPopup = true;
      },

      error: (err) => {
        this.showDeleteConfirm = false;

        console.log("🔥 ERROR:", err);

        let message = "Erreur lors de la suppression";

        // ✅ CAS 1 (LE BON POUR TOI)
        if (typeof err?.error === 'string') {
          message = err.error;
        }

        // ✅ CAS 2 (objet)
        else if (err?.error?.error) {
          message = err.error.error;
        }

        else if (err?.error?.message) {
          message = err.error.message;
        }

        this.popupMessage = message;
        this.isSuccess = false;
        this.showPopup = true;
      }
    });
  }

  handleMealSave(formData: FormData) {

    if (this.isEditMode && this.selectedMeal) {

      // ✅ CORRECTION ICI
      this.mealService.updateMealWithImage(this.selectedMeal.id, formData).subscribe({
        next: () => {
          this.afterSuccess("Repas modifié avec succès");
        },
        error: () => this.afterError()
      });

    } else {

      this.mealService.addMealWithImage(formData).subscribe({
        next: () => {
          this.afterSuccess("Repas ajouté avec succès");
        },
        error: () => this.afterError()
      });
    }
  }

  refresh() {

  }

  afterSuccess(message: string) {
    this.closeForm();

    this.popupMessage = message;
    this.isSuccess = true;
    this.showPopup = true;

    // refresh PRODUCTS
    if (this.currentView === 'products' && this.productList) {
      this.productList.reloadProducts();
    }

    // refresh MEALS
    if (this.currentView === 'meals' && this.mealList) {
      this.mealList.reloadMeals();
    }
  }

  afterError() {
    this.closeForm();
    this.popupMessage = "Erreur";
    this.isSuccess = false;
    this.showPopup = true;
  }

  showPopup = false;
  popupMessage = '';
  isSuccess = true;

  closePopup() {
    this.showPopup = false;
  }

  onRefreshMeals() {
  }
}