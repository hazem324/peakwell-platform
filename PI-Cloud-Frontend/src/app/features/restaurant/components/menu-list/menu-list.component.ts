import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../../../services/menu.service';
import { Menu } from '../../../../models/menu.model';
import { Meal } from '../../../../models/meal.model';

type FilterType = 'today' | 'week' | 'all';

@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss']
})
export class MenuListComponent implements OnInit {

  planReservations: any[] = [];
  showPlanPopup = false;

  planReservationCount = 0;

  reservationCountToday = 0;
  reservationCounts: { [key: number]: number } = {};

  currentPage = 1;
  pageSize = 4; 

  weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  todayMenu!: Menu;
  menus: Menu[] = [];
  weeklyMenus: Menu[] = [];

  selectedFilter: FilterType = 'today';

  selectedMeal: Meal | null = null;

  loading = false;
  errorMessage = '';

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading = true;

    this.menuService.getTodayMenu().subscribe({
      next: (data) => {
        this.todayMenu = data;

        this.loadReservationCounts();
      },
      error: (err) => console.error(err)
    });

    this.menuService.getAllMenus().subscribe({
      next: (data) => {
        this.menus = data;
        this.loadReservationCounts();
      },
      error: (err) => console.error(err)
    });

    this.menuService.getWeeklyMenus().subscribe({
      next: (data) => {
        this.weeklyMenus = data;
        this.loading = false;
        this.loadReservationCounts();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });

    this.menuService.getPlanReservationCount().subscribe({
      next: (count) => {
        this.planReservationCount = count;
      },
      error: (err) => console.error(err)
    });
  }

  loadReservationCounts() {

    const allMenus = [...this.menus, ...this.weeklyMenus];

    allMenus.forEach(menu => {

      this.menuService.getReservationCount(menu.id)
        .subscribe({
          next: (count) => {
            this.reservationCounts[menu.id] = count;
          },
          error: (err) => {
            console.error("Erreur count menu", menu.id, err);
            this.reservationCounts[menu.id] = 0;
          }
        });

    });
  }

  setFilter(filter: FilterType) {
    this.selectedFilter = filter;
    this.selectedMeal = null;
    this.currentPage = 1;
  }

  selectMeal(meal: Meal) {
    this.selectedMeal = meal;
  }



  get currentMenus() {
    return this.selectedFilter === 'week' ? this.weeklyMenus : this.menus;
  }

  get totalPages(): number {
    return Math.ceil(this.currentMenus.length / this.pageSize);
  }

  get paginatedMenus() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.currentMenus.slice(start, start + this.pageSize);
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

  get weekCalendar() {
    const startOfWeek = this.getStartOfWeek();

    return this.weekDays.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + index);

      const formatted = date.toISOString().split('T')[0];

      const menu = this.weeklyMenus.find(m => m.date === formatted);

      return {
        day,
        date: formatted,
        menu
      };
    });
  }

  getStartOfWeek(): Date {
    const today = new Date();
    const day = today.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    return monday;
  }

  moveUp(menu: Menu) {
    const index = this.weeklyMenus.indexOf(menu);
    if (index > 0) this.swap(index, index - 1);
  }

  moveDown(menu: Menu) {
    const index = this.weeklyMenus.indexOf(menu);
    if (index < this.weeklyMenus.length - 1) {
      this.swap(index, index + 1);
    }
  }


  private swap(i: number, j: number) {
    const temp = this.weeklyMenus[i];
    this.weeklyMenus[i] = this.weeklyMenus[j];
    this.weeklyMenus[j] = temp;

    this.saveOrder();
  }

  private saveOrder() {
    const ids = this.weeklyMenus.map(m => m.id);

    this.menuService.reorderMenus(ids).subscribe(() => {
      // reload pour dates
      this.menuService.getWeeklyMenus().subscribe(data => {
        this.weeklyMenus = data;
      });

      this.menuService.getTodayMenu().subscribe(data => {
        this.todayMenu = data;
      });

            this.menuService.getAllMenus().subscribe(data => {
        this.weeklyMenus = data;
      });
    });
  }

  openPlanPopup() {
    this.menuService.getPlanReservations().subscribe({
      next: (data) => {
        this.planReservations = data;
        this.showPlanPopup = true;
      },
      error: (err) => console.error(err)
    });
  }

  closePlanPopup() {
    this.showPlanPopup = false;
  }
  
}