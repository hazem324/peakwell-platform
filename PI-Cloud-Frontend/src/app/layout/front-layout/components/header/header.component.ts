import { Component , HostListener } from '@angular/core';
import { ToastServiceService } from '../../../../services/toast-service.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  menuOpen = false;
  scrolled = false;
  modalOpen = false;
  modalName = '';
  modalEmail = '';
  showAnnouncement = true;

  get announcementText(): string {
    const role = this.currentRole;
    if (role === 'DIETITIAN')   return '🩺 Welcome back — check your patient heatmap for new alerts.';
    if (role === 'RESTAURANT')  return '🍽️ Showcase your healthy menu to health-conscious PeakWell members.';
    return '🌿 Free Weight Loss Starter Kit with any newsletter signup — scroll down to claim yours.';
  }

  private readonly allNavLinks: { label: string; anchor?: string; route?: string; roles: string[] }[] = [
    { label: 'Articles',          anchor: 'blog',              roles: ['STUDENT', 'DIETITIAN', 'RESTAURANT'] },
    { label: 'Calculator',        anchor: 'calculator',        roles: ['STUDENT', 'DIETITIAN', 'RESTAURANT'] },
    { label: 'Events',            route:  '/events',           roles: ['STUDENT', 'RESTAURANT'] },
    { label: 'Registrations',     route:  '/my-registrations', roles: ['STUDENT'] },
    { label: 'Espace restaurant', route:  '/restaurant',       roles: ['RESTAURANT'] },
    { label: 'Espace Etudiant',   route:  '/etudiant',         roles: ['STUDENT'] },
    { label: 'Health Monitoring', route:  '/dossier',          roles: ['STUDENT'] },
    { label: 'About',             anchor: 'about',             roles: ['STUDENT', 'DIETITIAN', 'RESTAURANT'] },
  ];

  constructor(public toastService: ToastServiceService, private authService: AuthService) {}

  get currentRole(): string | null {
    return this.authService.getRoleFromToken();
  }

  get visibleNavLinks() {
    const role = this.currentRole;
    if (!role) return this.allNavLinks;
    return this.allNavLinks.filter(l => l.roles.includes(role));
  }

  get showNutritionistBtn(): boolean {
    return this.currentRole === 'DIETITIAN';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
  }

  get authNavItem() {
    return this.authService.isAuthenticated()
      ? { label: 'Profile', route: '/profile' }
      : { label: 'Login', route: '/auth/login' };
  }

  toggleMenu(): void  { this.menuOpen = !this.menuOpen; }
  closeMenu(): void   { this.menuOpen = false; }
  openModal(): void   { this.modalOpen = true; }
  closeModal(): void  { this.modalOpen = false; }

  scrollTo(anchor: string): void {
    this.closeMenu();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  }

  handleSignup(): void {
    if (!this.modalName.trim() || !this.modalEmail.trim()) {
      this.toastService.show('⚠️ Please enter your name and email');
      return;
    }
    this.closeModal();
    this.toastService.show(`🎉 Welcome, ${this.modalName}! Your kit is on its way!`);
    this.modalName = '';
    this.modalEmail = '';
  }

}