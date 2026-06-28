import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { AdminUser } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = environment.apiBaseUrl + '/users';

  
  private userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  user$ = this.userSubject.asObservable();

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient, private authSer: AuthService) {}



  getMe(): Observable<User> {
    const token = this.authSer.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<User>(`${this.baseUrl}/me`, { headers }).pipe(
      tap(user => this.setUser(user)) //  auto-store
    );
  }

  completeProfile(formData: FormData) {
    const token = this.authSer.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<User>(`${this.baseUrl}/complete-profile`, formData, { headers }).pipe(
      tap(user => this.setUser(user)) //  update user after completion
    );
  }


  private setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

getUserProfile(): Observable<UserProfile> {
  const token = this.authSer.getToken();

  return this.http.get<UserProfile>(`${this.baseUrl}/profile`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`
    })
  }).pipe(
    tap(profile => this.profileSubject.next(profile))
  );
}

updateUserProfile(formData: FormData): Observable<UserProfile> {
  const token = this.authSer.getToken();

  return this.http.patch<UserProfile>(
    `${this.baseUrl}/profile`,
    formData,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    }
  );
}

getAllUsers(): Observable<AdminUser[]> {
  const token = this.authSer.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

  return this.http.get<AdminUser[]>(`${this.baseUrl}/all`, { headers });
}

toggleUserStatus(userId: number, subject: string, message: string) {
  const token = this.authSer.getToken();

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.patch(
    `${this.baseUrl}/${userId}/toggle-status`,
    { subject, message }, 
    { headers }          
  );
}

  private loadUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  clearUser(): void {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }


  isProfileCompleted(): boolean {
    return this.getUser()?.profileCompleted || false;
  }

  getRole(): string | null {
    return this.getUser()?.role || null;
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}