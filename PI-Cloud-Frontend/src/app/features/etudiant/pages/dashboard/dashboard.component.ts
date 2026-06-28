import { Component } from '@angular/core';

type ViewType = 'meals' | 'menus' | 'plan';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  currentView: ViewType = 'menus'; 

  setView(view: ViewType) {
    this.currentView = view;
  }

}
