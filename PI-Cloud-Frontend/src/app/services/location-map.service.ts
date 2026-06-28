import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationMapService {

  constructor(private http: HttpClient) {}

  reverseGeocode(lat: number, lng: number): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    const headers = new HttpHeaders({
      'Accept-Language': 'fr'
    });

    return this.http.get(url, { headers });
  }
}