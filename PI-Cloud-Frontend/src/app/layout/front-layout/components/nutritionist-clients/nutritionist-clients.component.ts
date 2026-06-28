import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nutritionist-clients',
  templateUrl: './nutritionist-clients.component.html',
  styleUrls: ['./nutritionist-clients.component.scss']
})
export class NutritionistClientsComponent implements OnInit {
  private clientsUrl = 'http://localhost:8090/peakwell/api/consultations/clients';

  loading       = true;
  clients:      any[] = [];
  filtered:     any[] = [];
  search        = '';
  activeStatus  = 'all';

  private readonly avatarBgs = [
    '#fde8d8','#e8f0dd','#fff3e0','#e8e4f8','#d8eef8','#fde8ee','#e8f4dd','#fde8f4'
  ];
  private readonly avatarColors = [
    '#c96a3f','#5a8060','#c8883a','#7a4eb0','#3a80b0','#b04060','#4a8040','#9040b0'
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.http.get<any[]>(this.clientsUrl).subscribe({
      next: clients => {
        this.clients  = clients;
        this.filtered = clients;
        this.loading  = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    let result = this.clients;
    if (this.activeStatus !== 'all') {
      const want = this.activeStatus === 'active';
      result = result.filter(s => (s.enabled ?? true) === want);
    }
    const q = this.search.trim().toLowerCase();
    if (q) {
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.goal ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      );
    }
    this.filtered = result;
  }

  onSearch():              void { this.applyFilters(); }
  setStatus(s: string):   void { this.activeStatus = s; this.applyFilters(); }
  clearSearch():           void { this.search = ''; this.activeStatus = 'all'; this.applyFilters(); }

  openDossier(student: any): void {
    this.router.navigate(['/nutritionist/dossier', student.id], {
      state: { patientId: student.id, imageUrl: student.imageUrl ?? null }
    });
  }

  initials(s: any): string {
    return `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase();
  }

  avatarBg(id: number): string   { return this.avatarBgs[id   % this.avatarBgs.length]; }
  avatarColor(id: number): string { return this.avatarColors[id % this.avatarColors.length]; }

  statusColor(enabled: boolean): string {
    return enabled ? '#5a8060' : '#b5aaa5';
  }

  bmiColor(bmi: number): string {
    if (!bmi)      return '#c5bdb7';
    if (bmi < 18.5) return '#4ab8f0';
    if (bmi < 25)   return '#7a9e7e';
    if (bmi < 30)   return '#e88f68';
    return '#c96a3f';
  }

  bmiLabel(bmi: number): string {
    if (!bmi)      return '—';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  get activeCount():   number { return this.clients.filter(s => s.enabled).length; }
  get inactiveCount(): number { return this.clients.filter(s => !s.enabled).length; }
}