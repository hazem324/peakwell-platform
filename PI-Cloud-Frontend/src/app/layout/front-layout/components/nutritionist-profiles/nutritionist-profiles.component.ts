import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nutritionist-profiles',
  templateUrl: './nutritionist-profiles.component.html',
  styleUrls: ['./nutritionist-profiles.component.scss']
})
export class NutritionistProfilesComponent implements OnInit {
  private base = 'http://localhost:8090/peakwell/api/profile/all';

  loading      = true;
  profiles:    any[] = [];
  filtered:    any[] = [];
  search       = '';
  expandedId:  number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>(this.base).subscribe({
      next: p  => { this.profiles = p; this.filtered = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    const q = this.search.trim().toLowerCase();
    this.filtered = q
      ? this.profiles.filter(p =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.conditions?.some((c: string)  => c.toLowerCase().includes(q)) ||
          p.allergies?.some((a: string)   => a.toLowerCase().includes(q)) ||
          p.medications?.some((m: string) => m.toLowerCase().includes(q))
        )
      : this.profiles;
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  openDossier(profile: any): void {
    this.router.navigate(['/nutritionist/dossier', profile.studentId ?? profile.id], {
      state: { profile }
    });
  }

  initials(p: any): string {
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
  }
  avatarBg(i: number): string {
    return ['#fde8d8','#e8f0dd','#fff3e0','#e8e4f8','#d8eef8','#fde8ee'][i % 6];
  }
  avatarColor(i: number): string {
    return ['#c96a3f','#5a8060','#c8883a','#7a4eb0','#3a80b0','#b04060'][i % 6];
  }
  age(dob: string): string {
    if (!dob) return '—';
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) + ' y/o';
  }
  bloodTypeColor(bt: string): string {
    if (!bt) return '#b5aaa5';
    if (bt.includes('O'))  return '#c96a3f';
    if (bt.includes('AB')) return '#7a9e7e';
    if (bt.includes('A'))  return '#4ab8f0';
    return '#a47cf0';
  }
}
