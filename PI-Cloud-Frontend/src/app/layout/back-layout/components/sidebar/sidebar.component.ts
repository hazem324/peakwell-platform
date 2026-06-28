import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, CurrentUserDTO } from '../../../../services/auth.service';

interface NavItem {
  label: string;
  icon?: string;
  route?: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  navItems: NavItem[] = [

    { label: 'Dashboard',  icon: '📊', route: '/admin/dashboard'  },
    { label: 'Users',    icon: '👥', route: '/admin/users'},
    {label: 'User Reports', icon: '📈',route: '/admin/users/stats'},
    { label: 'Consultations', icon: '🗓', route: '/admin/consultations' },
    { label: 'Meal Plans', icon: '📋', route: '/admin/meal-plans'  },
    { label: 'Events', icon: '🏃', route: '/admin/events' },
    { label: 'Produits', icon: '🛒', route: '/admin/produits' },
    { label: 'Medical Profiles', icon: '🩺', route: '/admin/medical-profiles'  },


  ];

  currentUser: CurrentUserDTO | null = null;

  constructor(public router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Use cached user if available, otherwise fetch
    if (this.authService.currentUser) {
      this.currentUser = this.authService.currentUser;
    } else {
      this.authService.fetchCurrentUser().subscribe({
        next: user => { this.currentUser = user; },
        error: ()  => {}
      });
    }

    // Stay in sync if user changes (e.g. profile update)
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUser = user;
    });
  }

  get displayName(): string {
    if (!this.currentUser) return '…';
    return `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''}`.trim();
  }

  get displayRole(): string {
    const role = this.currentUser?.role ?? '';
    const map: Record<string, string> = {
      ADMIN:      'Administrator',
      DIETITIAN:  'Registered Dietitian',
      STUDENT:    'Student',
      NUTRITIONIST: 'Nutritionist',
    };
    return map[role.toUpperCase()] ?? role;
  }

  get initials(): string {
    if (!this.currentUser) return '?';
    const f = this.currentUser.firstName?.[0] ?? '';
    const l = this.currentUser.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
  
}