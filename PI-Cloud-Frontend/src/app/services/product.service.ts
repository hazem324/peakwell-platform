import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, ProductRequest } from '../models/product.model';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private api = 'http://localhost:8090/peakwell/products';

  constructor(private http: HttpClient,  private auth: AuthService) {}

  getAll() {
    return this.http.get<Product[]>(this.api);
  }

  create(product: ProductRequest) {
    return this.http.post<Product>(this.api, product);
  }

  update(id: number, product: ProductRequest) {
    return this.http.put(`${this.api}/${id}`, product);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  restock(productId: number, quantity: number) {
    return this.http.post(
      `${this.api}/${productId}/restock?quantity=${quantity}`,
      {}
    );
  }

  createWithImage(formData: FormData) {
    const token = this.auth.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(
      'http://localhost:8090/peakwell/products/with-image',
      formData,
      { headers }
    );
  }

  updateWithImage(id: number, formData: FormData) {
    const token = this.auth.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(
      `http://localhost:8090/peakwell/products/${id}/with-image`,
      formData,
      { headers }
    );
  }
}