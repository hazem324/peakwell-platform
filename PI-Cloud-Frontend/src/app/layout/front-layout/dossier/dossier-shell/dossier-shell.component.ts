import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DossierService } from '../services/dossier.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-dossier-shell',
  templateUrl: './dossier-shell.component.html',
  styleUrls: ['./dossier-shell.component.scss']
})
export class DossierShellComponent implements OnInit {
  profile: any = null;
  hasEntries = false;
  activeTab = 'profile';
  loading = true;
  editingProfile = false;
  avatarUrl: string | null = null;

  constructor(
    public dossierService: DossierService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  allTabs = [
    { value: 'profile',       label: '👤 Profile',    show: 'always' },
    { value: 'add',           label: '➕ Measure',     show: 'always' },
    { value: 'goals',         label: '🎯 Goals',       show: 'always' },
    { value: 'consultations', label: '🩺 Consult',     show: 'always' },
    { value: 'insights',      label: '🤖 Insights',    show: 'hasEntries' },
    { value: 'diagnosis',     label: '🧠 Diagnosis',   show: 'always' },
    { value: 'report',        label: '📄 Report',      show: 'hasEntries' },
  ];

  visibleTabs: any[] = [];

  trackTab(_index: number, tab: any): string { return tab.value; }

  private updateVisibleTabs(): void {
    this.visibleTabs = this.allTabs.filter(t =>
      t.show === 'always' || (t.show === 'hasEntries' && this.hasEntries)
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.activeTab = params['tab'];
    });

    // Load avatar from cached user or fetch if needed
    const cached = this.authService.currentUser;
    if (cached?.imageUrl) {
      this.avatarUrl = cached.imageUrl;
    } else {
      this.authService.fetchCurrentUser().subscribe(user => {
        this.avatarUrl = user?.imageUrl ?? null;
      });
    }

    this.dossierService.loadProfile();
    this.dossierService.loadBiometrics();

    this.dossierService.profile$.subscribe(p => {
      this.profile = p;
      this.loading = false;
      if ((!p || !p.complete) && !this.route.snapshot.queryParams['tab']) {
        this.activeTab = 'profile';
      }
      this.updateVisibleTabs();
    });

    this.dossierService.entries$.subscribe(e => {
      this.hasEntries = e.length > 0;
      if (!this.hasEntries && this.activeTab === 'charts') {
        this.activeTab = 'profile';
      }
      this.updateVisibleTabs();
    });

    this.updateVisibleTabs();
  }

  get pageSubtitle(): string {
    if (this.loading) return 'Loading your health data…';
    if (!this.profile || !this.profile.complete) return 'Complete your medical profile to get started';
    if (!this.hasEntries) return 'Add your first biometric measurement';
    return `Last updated: ${this.dossierService.latest?.recordedAt
      ? new Date(this.dossierService.latest.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—'}`;
  }

  get isProfileComplete(): boolean { return this.profile?.complete ?? false; }

  get profileInitials(): string {
    if (!this.profile) return '';
    return (this.profile.firstName?.[0] ?? '') + (this.profile.lastName?.[0] ?? '');
  }

  get profileFullName(): string {
    if (!this.profile) return '';
    return `${this.profile.firstName ?? ''} ${this.profile.lastName ?? ''}`.trim();
  }

  get profileBloodType(): string { return this.profile?.bloodType ?? ''; }
  get profileGender(): string { return this.profile?.gender ?? ''; }

  get profileAge(): number | null {
    const dob = this.profile?.dateOfBirth;
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }
}