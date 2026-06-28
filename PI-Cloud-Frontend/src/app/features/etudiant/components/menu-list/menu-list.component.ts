import { Component } from '@angular/core';  
import { Menu } from '../../../../models/menu.model';
import { MenuService } from '../../../../services/menu.service';
import { ReservationService } from '../../../../services/reservation.service';


@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss'
})
export class MenuListComponent {
  todayMenu!: Menu;
  reservationCount = 0;
  isReserved = false;

  constructor(private menuService: MenuService, private reservationService: ReservationService) {}
  
  ngOnInit(): void {
    this.loadMenu();
  }
  
  loadMenu(): void {  
    this.menuService.getTodayMenu().subscribe({
      next: (data) => {
        this.todayMenu = data;
        this.loadReservationData();
      },
      error: (err) => console.error(err)
    });
  }

  get totalCalories(): number {
    return (this.todayMenu?.breakfast?.totalCalories || 0)
        + (this.todayMenu?.lunch?.totalCalories || 0)
        + (this.todayMenu?.dinner?.totalCalories || 0);
  }

  get totalProtein(): number {
    return (this.todayMenu?.breakfast?.totalProtein || 0)
        + (this.todayMenu?.lunch?.totalProtein || 0)
        + (this.todayMenu?.dinner?.totalProtein || 0);
  }

  get totalCarbs(): number {
    return (this.todayMenu?.breakfast?.totalCarbs || 0)
        + (this.todayMenu?.lunch?.totalCarbs || 0)
        + (this.todayMenu?.dinner?.totalCarbs || 0);
  }

  get totalFats(): number {
    return (this.todayMenu?.breakfast?.totalFats || 0)
        + (this.todayMenu?.lunch?.totalFats || 0)
        + (this.todayMenu?.dinner?.totalFats || 0);
  }

  loadReservationData() {

    if (!this.todayMenu?.id) return;

    this.reservationService.getReservationCount(this.todayMenu.id)
      .subscribe(count => this.reservationCount = count);

    this.reservationService.isReserved(this.todayMenu.id)
      .subscribe(res => this.isReserved = res);
  }

  toggleReservation() {

    this.reservationService.toggleReservation(this.todayMenu.id)
      .subscribe({
        next: () => {
          this.isReserved = !this.isReserved;
          this.reservationCount += this.isReserved ? 1 : -1;
        },
        error: (err) => {
          this.handleError(err); 
        }
      });
  }

  handleError(err: any) {

    const message =
      err?.error?.message ||
      err?.error?.error ||
      "Une erreur est survenue";

    if (message.includes("plan")) {
      this.showPopup("Vous avez déjà réservé un plan");
    } 
    else if (message.includes("menu")) {
      this.showPopup("Vous avez déjà réservé un menu");
    } 
    else {
      this.showPopup(message);
    }

    console.error(err);
  }

  popupMessage: string = "";
  showPopupFlag = false;

  showPopup(message: string) {
    this.popupMessage = message;
    this.showPopupFlag = true;

    setTimeout(() => {
      this.showPopupFlag = false;
    }, 3000);
  }
}