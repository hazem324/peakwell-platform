import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RestaurantRoutingModule } from './restaurant-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { MealListComponent } from './components/meal-list/meal-list.component';
import { MenuListComponent } from './components/menu-list/menu-list.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../layout/front-layout/components/header/header.component';
import { FooterComponent } from '../../layout/front-layout/components/footer/footer.component';
import { FrontLayoutModule } from '../../layout/front-layout/front-layout.module';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { MealFormComponent } from './components/meal-form/meal-form.component';
import { DragDropModule } from '@angular/cdk/drag-drop';



@NgModule({
  declarations: [
    DashboardComponent,
    ProductListComponent,
    MealListComponent,
    MenuListComponent,
    ProductFormComponent,
    MealFormComponent
  ],
  imports: [
    CommonModule,
    RestaurantRoutingModule,
    FormsModule,
    FrontLayoutModule,
    DragDropModule,
    FrontLayoutModule
  ]
})
export class RestaurantModule { }
