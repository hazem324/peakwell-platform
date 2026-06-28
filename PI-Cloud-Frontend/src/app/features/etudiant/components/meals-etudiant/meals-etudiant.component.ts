import { Component , OnInit } from '@angular/core';
import { MealService } from '../../../../services/meal.service';
import { Meal } from '../../../../models/meal.model';

@Component({
  selector: 'app-meals-etudiant',
  templateUrl: './meals-etudiant.component.html',
  styleUrl: './meals-etudiant.component.scss'
})
export class MealsEtudiantComponent implements OnInit{

  showFavoritesPopup = false;

  currentPage = 1;
  pageSize = 8; 

  searchTerm: string = '';
  filteredMeals: Meal[] = [];

  tags: string[] = [
    'High Protein', 'Low Protein',
    'High Calories', 'Low Calories',
    'High Fats', 'Low Fats',
    'High Carbs', 'Low Carbs'
  ];

  selectedTags: string[] = [];

  meals: Meal[] = [];

  favoriteIds: number[] = [];

  constructor(private mealService: MealService) {}


  selectedMeal: Meal | null = null;
  grams: number = 100;


  ngOnInit(): void {
    this.loadMeals();
      this.mealService.getFavorites().subscribe({
      next: (ids) => this.favoriteIds = ids
    });

  }

  loadMeals(): void {
    this.mealService.getAll().subscribe({
      next: (res) => {
        this.meals = res;
        this.filteredMeals = res;
        this.currentPage = 1;
      },
      error: (err) => console.error(err)
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMeals.length / this.pageSize));
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

  get pages() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  showIngredientsMap: { [key: number]: boolean } = {};

  toggleIngredients(mealId: number) {
    this.showIngredientsMap[mealId] = !this.showIngredientsMap[mealId];
  }

  isFavorite(mealId: number): boolean {
  return this.favoriteIds.includes(mealId);
}

  toggleFavorite(meal: Meal) {
    this.mealService.toggleFavorite(meal.id).subscribe(() => {

      if (this.favoriteIds.includes(meal.id)) {
        this.favoriteIds = this.favoriteIds.filter(id => id !== meal.id);
        meal.favoriteCount--;
      } else {
        this.favoriteIds.push(meal.id);
        meal.favoriteCount++;
      }

    });
  }

  get favoriteMeals(): Meal[] {
    return this.meals.filter(m => this.favoriteIds.includes(m.id));
  }
}