import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { HttpResponse } from '@angular/common/http'
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, BehaviorSubject } from 'rxjs';
import { ForgetPasswordRequest, LoginRequest, LoginResponse, SignupRequest } from '../models/auth.model';

export interface CurrentUserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileCompleted: boolean;
  enabled: boolean;
  phoneNumber: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router:Router) { }

  private baseUrl = environment.apiBaseUrl + '/auth';
  private usersUrl = environment.apiBaseUrl + '/users';

  private _currentUser: CurrentUserDTO | null = null;
  readonly currentUser$ = new BehaviorSubject<CurrentUserDTO | null>(null);

  get currentUser(): CurrentUserDTO | null {
    return this._currentUser;
  }

  get displayTitle(): string {
    if (!this._currentUser) return '';
    const { firstName, lastName } = this._currentUser;
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  fetchCurrentUser(): Observable<CurrentUserDTO> {
    return this.http.get<CurrentUserDTO>(`${this.usersUrl}/me`).pipe(
      tap(user => {
        this._currentUser = user;
        this.currentUser$.next(user);
      })
    );
  }

  /** Returns the cached current user (populated after fetchCurrentUser). */
  decodeToken(): CurrentUserDTO | null {
    return this._currentUser;
  }

   register(request: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, request, { observe: 'response' });
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      data,
      { observe: 'response' }
    ).pipe(
      tap((res: HttpResponse<LoginResponse>) => {
        console.log('Status:', res.status);
        console.log('Body:', res.body);

        if (res.body?.accessToken) {
          this.saveToken(res.body.accessToken);
          // clear cached user on new login
          this._currentUser = null;
          this.currentUser$.next(null);
        }
      }),
      map((res: HttpResponse<LoginResponse>) => res.body as LoginResponse)
    );
  }

  // login and signup with google 

  getGoogleUrl(flow: 'login' | 'signup'): Observable<{ url: string }> {
  return this.http.get<{ url: string }>(
    `${this.baseUrl}/google-url?flow=${flow}`
  );
}

handleGoogleAuth(code: string, flow: 'login' | 'signup'): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/google`, {
    code,
    flow
  });
}

completeGoogleSignup(accessToken: string, role: string) {
  return this.http.post(`${this.baseUrl}/google/complete-signup`, {
    accessToken,
    role
  });
}

 

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
  const token = localStorage.getItem('token');

  if (token && this.isTokenExpired(token)) {
    this.logout();
    return null;
  }

  return token;
}

  getRoleFromToken(): string | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    const roles: string[] = decoded?.realm_access?.roles || [];

    //  your app roles
    const appRoles = ['STUDENT', 'DIETITIAN', 'RESTAURANT', 'ADMIN'];

    const foundRole = roles.find(r => appRoles.includes(r));

    return foundRole || null;

  } catch (e) {
    return null;
  }
}

  isAuthenticated(): boolean {
  const token = this.getToken();

  if (!token) return false;

  if (this.isTokenExpired(token)) {
    this.logout(); // auto cleanup
    return false;
  }

  return true;
}


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
     if (this.router.url !== '/auth/login') {
    this.router.navigate(['/auth/login']);
  }
  }

forgotPassword(data: ForgetPasswordRequest): Observable<any> {
  return this.http.post<any>(
    `${this.baseUrl}/forgot-password`,
    data,
    { observe: 'response' }
  ).pipe(
    tap((res) => {
      console.log('FORGOT PASSWORD RESPONSE:', res);

      if (res.status === 200) {
        console.log('Email sent successfully');
      }
    }),
    map((res) => res.body),
    catchError((err) => {
      console.error('FORGOT PASSWORD ERROR:', err);

      return throwError(() => err);
    })
  );
}

isTokenExpired(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true; // invalid token = expired
  }
}


faceLogin(payload: { email: string; imageBase64: string }): Observable<any> {
  return this.http.post(`${this.baseUrl}/face-login`, payload).pipe(
    tap((res: any) => {
      if (res?.accessToken) {
        localStorage.setItem('token', res.accessToken);
        if (res.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
      }
    })
  );
}

changePassword(oldPassword: string, newPassword: string): Observable<any> {
  const token = this.getToken();

  console.log("change passordword", token)
  if (!token) {
    return throwError(() => ({ status: 401, error: { message: 'Not authenticated' } }));
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(
    `${this.baseUrl}/change-password`,
    { oldPassword, newPassword },
    { headers }
  ).pipe(
    tap(() => console.log('Password changed successfully')),
    catchError((err) => {
      console.error('CHANGE PASSWORD ERROR:', err);
      return throwError(() => err);
    })
  );
}


}
