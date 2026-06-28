import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlanService } from '../../../../services/plan.service';
import { Plan } from '../../../../models/plan.model';
import { ReservationService } from '../../../../services/reservation.service';


@Component({
  selector: 'app-plan-etudiant',
  templateUrl: './plan-etudiant.component.html',
  styleUrls: ['./plan-etudiant.component.scss']
})
export class PlanEtudiantComponent implements OnInit {

  plan: Plan | null = null;
  loading = true;
  error: string | null = null;

  isPlanReserved = false;

  constructor(private http: HttpClient, private planService: PlanService, private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.loadPlan();
  }

  loadPlan(): void {
    this.planService.getPlan().subscribe({
      next: (res) => {
        this.plan = res;
        this.loading = false;

        // CHECK RESERVATION
        if (this.plan?.id) {
          this.checkReservation();
        }
      },
      error: (err) => {
        this.error = "Erreur lors du chargement du plan";
        this.loading = false;
        console.error(err);
      }
    });
  }

  checkReservation() {
    if (!this.plan) return;

    this.reservationService.isPlanReserved(this.plan.id)
      .subscribe(res => {
        this.isPlanReserved = res;
      });
  }

  getTotalProtein(): number {
  return (this.plan?.breakfast?.totalProtein || 0) +
         (this.plan?.lunch?.totalProtein || 0) +
         (this.plan?.dinner?.totalProtein || 0);
}

  getTotalCarbs(): number {
    return (this.plan?.breakfast?.totalCarbs || 0) +
          (this.plan?.lunch?.totalCarbs || 0) +
          (this.plan?.dinner?.totalCarbs || 0);
  }

  getTotalFats(): number {
    return (this.plan?.breakfast?.totalFats || 0) +
          (this.plan?.lunch?.totalFats || 0) +
          (this.plan?.dinner?.totalFats || 0);
  }

  format(value: number): string {
    return value?.toFixed(1);
  }

  reservePlan() {

    if (!this.plan?.id) return;

    if (this.isPlanReserved) {

      this.reservationService.cancelPlan(this.plan.id).subscribe({
        next: () => {
          this.isPlanReserved = false;
          this.showPopup("Réservation annulée");
        },
        error: (err) => {
          this.handleError(err);
        }
      });

    } else {

      this.reservationService.reservePlan(this.plan.id).subscribe({
        next: () => {
          this.isPlanReserved = true;
          this.showPopup("Plan réservé avec succès");
        },
        error: (err) => {
          this.handleError(err);
        }
      });

    }
  }

  getCaloriePercentage(): number {
    if (!this.plan?.targetCalories) return 0;

    return Math.min(
      (this.plan.totalCalories / this.plan.targetCalories) * 100,
      100
    );
  }

  handleError(err: any) {

    const message =
    err?.error?.message ||  
    err?.error?.error ||   
    "Une erreur est survenue";

    if (message.includes("menu")) {
      this.showPopup("Vous avez déjà réservé le menu du jour");
    } 
    else if (message.includes("plan")) {
      this.showPopup("Vous avez déjà réservé un plan");
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