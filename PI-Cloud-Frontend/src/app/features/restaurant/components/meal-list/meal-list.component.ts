import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MealService } from '../../../../services/meal.service';
import { Meal } from '../../../../models/meal.model';

@Component({
  selector: 'app-meal-list',
  templateUrl: './meal-list.component.html',
  styleUrls: ['./meal-list.component.scss']
})
export class MealListComponent implements OnInit {

  @Output() deleteMealEvent = new EventEmitter<number>();

  currentPage = 1;
  pageSize = 4;

  meals: Meal[] = [];
  showIngredientsMap: { [key: number]: boolean } = {};

  showForm = false;
  selectedMeal: Meal | null = null;
  isEditMode = false;

  searchTerm: string = '';
  filteredMeals: Meal[] = [];

  tags: string[] = [
    'High Protein', 'Low Protein',
    'High Calories', 'Low Calories',
    'High Fats', 'Low Fats',
    'High Carbs', 'Low Carbs'
  ];

  selectedTags: string[] = [];

  @Output() addMeal = new EventEmitter<void>();
  @Output() editMealEvent = new EventEmitter<any>();
  @Output() refreshMeals = new EventEmitter<void>();

  constructor(private mealService: MealService) {}

  ngOnInit(): void {
    this.loadMeals();
  }

  loadMeals(): void {
    this.mealService.getAll().subscribe({
      next: (res) => {

        console.log("BACKEND RESPONSE:", res); 

        this.meals = res.map(m => ({
          ...m,
          predictedAllergens: [...(m.predictedAllergens || [])]
        }));

        this.filteredMeals = [...this.meals]; 
      },
      error: (err) => console.error(err)
    });
  }

  toggleIngredients(mealId: number): void {
    this.showIngredientsMap[mealId] = !this.showIngredientsMap[mealId];
  }
  
  openForm() {
    this.addMeal.emit(); 
  }

  closeForm() {
    this.showForm = false;
    this.selectedMeal = null;
    this.isEditMode = false;
  }

  onMealAdded(meal: any) {

    if (this.isEditMode && this.selectedMeal) {
      this.mealService.updateMealWithImage(this.selectedMeal.id, meal).subscribe({
        next: () => {
          this.meals = [];
          this.loadMeals();
          this.closeForm();
        },
        error: err => console.error(err)
      });

    } else {
      this.mealService.addMealWithImage(meal).subscribe({
        next: () => {
          this.meals = [];
          this.loadMeals();
          this.closeForm();
        },  
        error: err => console.error(err)
      });
    }
  }

  editMeal(meal: Meal) {
    this.selectedMeal = meal;
    this.isEditMode = true;
    this.showForm = true;
    this.editMealEvent.emit(meal);
  }

  deleteMeal(id: number) {
    this.deleteMealEvent.emit(id);
  }

  reloadMeals() {
   this.loadMeals();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMeals.length / this.pageSize);
  }

  get paginatedMeals() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMeals.slice(start, start + this.pageSize);
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();

    this.filteredMeals = this.meals.filter(m => {

      // SEARCH
      const matchesSearch =
        m.name.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term);

      // TAGS
      const matchesTags = this.selectedTags.every(tag => {

        switch (tag) {

          case 'High Protein': return m.totalProtein >= 20;
          case 'Low Protein': return m.totalProtein < 10;

          case 'High Calories': return m.totalCalories >= 300;
          case 'Low Calories': return m.totalCalories < 150;

          case 'High Fats': return m.totalFats >= 20;
          case 'Low Fats': return m.totalFats < 10;

          case 'High Carbs': return m.totalCarbs >= 50;
          case 'Low Carbs': return m.totalCarbs < 20;

          default: return true;
        }
      });

      return matchesSearch && matchesTags;
    });

    this.currentPage = 1;
  }

  getTagGroup(tag: string): string {
    if (tag.includes('Protein')) return 'protein';
    if (tag.includes('Calories')) return 'calories';
    if (tag.includes('Fats')) return 'fats';
    if (tag.includes('Carbs')) return 'carbs';
    return '';
  }

  toggleTag(tag: string) {
    const group = this.getTagGroup(tag);

    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      this.selectedTags = this.selectedTags.filter(t => this.getTagGroup(t) !== group);
      this.selectedTags.push(tag);
    }

    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}