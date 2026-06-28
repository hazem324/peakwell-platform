import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Menu } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {

  private api = 'http://localhost:8090/peakwell/menu';

  constructor(private http: HttpClient) {}

  getTodayMenu() {
    return this.http.get<Menu>(`${this.api}/today`);
  }

  getAllMenus() {
    return this.http.get<Menu[]>(this.api);
  }

    getWeeklyMenus(){
    return this.http.get<Menu[]>(`${this.api}/week`);
  }

  create(menu: any) {
    return this.http.post<Menu>(this.api, menu);
  }

  generateMenu() {
    return this.http.post<Menu>(`${this.api}/generate`, {});
  }

  reorderMenus(ids: number[]) {
    return this.http.put('http://localhost:8090/peakwell/menu/reorder', ids);
  }

  getReservationCount(menuId: number) {
    return this.http.get<number>(
      `http://localhost:8090/peakwell/reservations/count/${menuId}`
    );
  }

  getPlanReservationCount() {
    return this.http.get<number>('http://localhost:8090/peakwell/reservations/plan/count');
  }

  getPlanReservations() {
    return this.http.get<any[]>('http://localhost:8090/peakwell/reservations/plan');
  }
}