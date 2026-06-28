import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Meal } from '../models/meal.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MealService {

  private api = 'http://localhost:8090/peakwell/meals';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAll() {
    return this.http.get<Meal[]>(this.api, {
      headers: this.getHeaders()
    });
  }

  addMeal(meal: any) {
    return this.http.post<Meal>(this.api, meal, {
      headers: this.getHeaders()
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`, {
      headers: this.getHeaders()
    });
  }

  update(id: number, product: any) {
    return this.http.put(`${this.api}/${id}`, product, {
      headers: this.getHeaders()
    });
  }

  addMealWithImage(formData: FormData) {
    return this.http.post(
      `${this.api}/with-image`,
      formData,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateMealWithImage(id: number, formData: FormData) {
    return this.http.put(
      `${this.api}/${id}/with-image`,
      formData,
      {
        headers: this.getHeaders()
      }
    );
  }

  toggleFavorite(mealId: number) {

    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(
      `http://localhost:8090/peakwell/favorites/${mealId}`,
      {},
      { headers }
    );
  }

  getFavorites() {

    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<number[]>(
      `http://localhost:8090/peakwell/favorites`,
      { headers }
    );
  }
}