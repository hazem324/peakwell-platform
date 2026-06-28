import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const role = this.userService.getRole();

    if (role === 'ADMIN') {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}