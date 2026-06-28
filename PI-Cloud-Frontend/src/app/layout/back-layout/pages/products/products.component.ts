import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  selectedProduct: any = null;
  showEditPopup = false;
  selectedFile!: File;
  errorPopup = false;
  errorMessage = '';

  products: any[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error(err)
    });
  }


  editProduct(product: any) {
    this.selectedProduct = { ...product }; 
    this.showEditPopup = true;
  }

  closePopup() {
    this.showEditPopup = false;
  }

  updateProduct() {

    const formData = new FormData();

    const productPayload = {
      name: this.selectedProduct.name,
      description: this.selectedProduct.description,
      calories: this.selectedProduct.calories,
      protein: this.selectedProduct.protein,
      carbs: this.selectedProduct.carbs,
      fats: this.selectedProduct.fats,
      category_Product: this.selectedProduct.category_Product,
      stock: this.selectedProduct.stock,
      unit: this.selectedProduct.unit,
      minStock: this.selectedProduct.minStock
    };

    formData.append(
      'product',
      new Blob([JSON.stringify(productPayload)], { type: 'application/json' })
    );

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productService.updateWithImage(this.selectedProduct.id, formData)
      .subscribe({
        next: () => {
          this.showEditPopup = false;
          this.loadProducts();
        },
        error: (err) => console.error(err)
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  getImagePreview(): string | null {

    if (this.selectedFile) {
      return URL.createObjectURL(this.selectedFile);
    }

    if (this.selectedProduct?.image) {
      return 'http://localhost:8090/peakwell/uploads/' + this.selectedProduct.image;
    }

    return null;
  }

  deleteProduct(id: number) {

    const confirmDelete = confirm("⚠️ Supprimer ce produit ?");
    if (!confirmDelete) return;

    this.productService.delete(id).subscribe({

      next: () => {
        this.products = this.products.filter(p => p.id !== id);
      },

      error: (err) => {

        this.errorPopup = true;

        console.error(err);
      }
    });
  }
}