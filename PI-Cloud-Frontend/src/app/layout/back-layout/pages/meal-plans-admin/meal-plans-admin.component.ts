import { Component } from '@angular/core';

import { AdminDataService, Client } from '../../../../services/admin-data.service';
import { ToastServiceService } from '../../../../services/toast-service.service';

export interface MealPlan {
  id: number;
  clientName: string;
  clientInitials: string;
  avatarColor: string;
  goal: string;
  calories: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring' | 'expired';
  adherence: number;
  mealsPerDay: number;
  protein: number;
  carbs: number;
  fat: number;
}


@Component({
  selector: 'app-meal-plans-admin',
  templateUrl: './meal-plans-admin.component.html',
  styleUrl: './meal-plans-admin.component.scss'
})
export class MealPlansAdminComponent {


  activeTab = 'all';
  tabs = ['all', 'active', 'expiring', 'expired'];
  showCreateModal = false;

  newPlan = {
    clientName: '',
    calories: 1800,
    goal: 'Weight Loss',
    mealsPerDay: 3,
  };

  goals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'Sports Nutrition'];

  plans: MealPlan[] = [
    { id: 1, clientName: 'Maya Johnson',  clientInitials: 'MJ', avatarColor: '#fde8d8', goal: 'Weight Loss',     calories: 1600, startDate: 'Feb 1',  endDate: 'Mar 30', status: 'active',   adherence: 88, mealsPerDay: 5, protein: 120, carbs: 160, fat: 50  },
    { id: 2, clientName: 'Carlos Mena',   clientInitials: 'CM', avatarColor: '#e8f0dd', goal: 'Muscle Gain',     calories: 2800, startDate: 'Jan 15', endDate: 'Mar 15', status: 'expiring', adherence: 95, mealsPerDay: 6, protein: 210, carbs: 280, fat: 90  },
    { id: 3, clientName: 'James Fowler',  clientInitials: 'JF', avatarColor: '#fff3e0', goal: 'Weight Loss',     calories: 1500, startDate: 'Jan 1',  endDate: 'Feb 28', status: 'expired',  adherence: 54, mealsPerDay: 4, protein: 110, carbs: 150, fat: 45  },
    { id: 4, clientName: 'Priya Sharma',  clientInitials: 'PS', avatarColor: '#fce4ec', goal: 'Heart Health',    calories: 1800, startDate: 'Feb 10', endDate: 'Apr 10', status: 'active',   adherence: 91, mealsPerDay: 5, protein: 130, carbs: 200, fat: 55  },
    { id: 5, clientName: 'Emma Clarke',   clientInitials: 'EC', avatarColor: '#e8eaf6', goal: 'Sports Nutrition',calories: 2400, startDate: 'Feb 20', endDate: 'Mar 16', status: 'expiring', adherence: 79, mealsPerDay: 6, protein: 180, carbs: 260, fat: 70  },
    { id: 6, clientName: 'Liam Torres',   clientInitials: 'LT', avatarColor: '#f9fbe7', goal: 'Diabetes Mgmt',  calories: 1700, startDate: 'Mar 1',  endDate: 'Apr 30', status: 'active',   adherence: 83, mealsPerDay: 5, protein: 125, carbs: 170, fat: 55  },
  ];

  constructor(public toastService: ToastServiceService) {}

  get filteredPlans(): MealPlan[] {
    if (this.activeTab === 'all') return this.plans;
    return this.plans.filter(p => p.status === this.activeTab);
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      active: '#7a9e7e', expiring: '#c96a3f', expired: '#b5aaa5'
    };
    return map[status] ?? '#b5aaa5';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active: '✅ Active', expiring: '⚠️ Expiring', expired: '⛔ Expired'
    };
    return map[status] ?? status;
  }

  openCreate(): void  { this.showCreateModal = true; }
  closeCreate(): void { this.showCreateModal = false; }

  createPlan(): void {
    if (!this.newPlan.clientName.trim()) return;
    this.toastService.show(`📋 Plan created for ${this.newPlan.clientName}`);
    this.closeCreate();
  }

  renewPlan(plan: MealPlan): void {
    this.toastService.show(`🔄 Renewing plan for ${plan.clientName}`);
  }

  editPlan(plan: MealPlan): void {
    this.toastService.show(`✏️ Editing plan for ${plan.clientName}`);
  }
  countByStatus(status: string): number {
  return this.plans.filter(p => p.status === status).length;
}
}
