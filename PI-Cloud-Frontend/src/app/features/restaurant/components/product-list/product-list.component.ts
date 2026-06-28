import { Component, EventEmitter, Output } from '@angular/core';
import { AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {

  @ViewChildren('desc') descElements!: QueryList<ElementRef>;

  isOverflowMap: { [key: number]: boolean } = {};

  expandedProducts = new Set<number>();

  currentPage = 1;
  pageSize = 6;

  searchTerm: string = '';
  filteredProducts: Product[] = [];

  tags: string[] = [
    'High Protein', 'Low Protein',
    'High Calories', 'Low Calories',
    'High Fats', 'Low Fats',
    'High Carbs', 'Low Carbs'
  ];

  selectedTags: string[] = [];

  products: Product[] = [];

  constructor(private productService: ProductService) {} 

  @Output() addProduct = new EventEmitter<void>(); 
  @Output() deleteProduct = new EventEmitter<number>();
  @Output() editProduct = new EventEmitter<Product>();

  categoryMap: any = {
  PROTEIN: 'Sources de protéines',
  CARB: 'Glucides',
  FAT: 'Matières grasses',
  VEGETABLE: 'Légumes',
  DAIRY: 'Produits laitiers'
  };

  ngAfterViewInit() {
    setTimeout(() => {
      this.checkOverflow();
    });
  }

  checkOverflow() {
    this.descElements.forEach((el, index) => {
      const element = el.nativeElement;
      const product = this.paginatedProducts[index];

      if (product) {
        this.isOverflowMap[product.id] =
          element.scrollHeight > element.clientHeight;
      }
    });
  }

  onAddClick() {
    this.addProduct.emit();
  }
  onDelete(id: number) {
  this.deleteProduct.emit(id);
  }

  onEdit(product: Product) {
    this.editProduct.emit(product);
  } 

  ngOnInit() {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products = res;
        this.filteredProducts = res;
        setTimeout(() => this.checkOverflow());
      },
      error: (err) => console.error(err)
    });
  }

  reloadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products = res;
        this.filteredProducts = res;
      },
      error: (err) => console.error(err)
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      setTimeout(() => this.checkOverflow());
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      setTimeout(() => this.checkOverflow());
    }
  }

  getTagGroup(tag: string): string {
    if (tag.includes('Protein')) return 'protein';
    if (tag.includes('Calories')) return 'calories';
    if (tag.includes('Fats')) return 'fats';
    if (tag.includes('Carbs')) return 'carbs';
    return '';
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();

    this.filteredProducts = this.products.filter(p => {

      // SEARCH
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.category_Product?.toLowerCase().includes(term) ?? false)

      // TAG FILTER
      const matchesTags = this.selectedTags.every(tag => {

        switch (tag) {

          case 'High Protein': return p.protein >= 20;
          case 'Low Protein': return p.protein < 10;

          case 'High Calories': return p.calories >= 300;
          case 'Low Calories': return p.calories < 150;

          case 'High Fats': return p.fats >= 20;
          case 'Low Fats': return p.fats < 10;

          case 'High Carbs': return p.carbs >= 50;
          case 'Low Carbs': return p.carbs < 20;

          default: return true;
        }
      });

      setTimeout(() => this.checkOverflow());
      return matchesSearch && matchesTags;
    });

    this.currentPage = 1;
  }

  onSearch() {
    this.applyFilters();
  }

  toggleTag(tag: string) {
    const group = this.getTagGroup(tag);

    if (this.selectedTags.includes(tag)) {
      // désélection normale
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      // supprimer les tags du même groupe
      this.selectedTags = this.selectedTags.filter(t => this.getTagGroup(t) !== group);

      // ajouter le nouveau
      this.selectedTags.push(tag);
    }

    this.applyFilters();
  }

  toggleDescription(product: Product) {
    if (this.expandedProducts.has(product.id)) {
      this.expandedProducts.delete(product.id);
    } else {
      this.expandedProducts.add(product.id);
    }
  }

  isExpanded(product: Product): boolean {
    return this.expandedProducts.has(product.id);
  }
}
