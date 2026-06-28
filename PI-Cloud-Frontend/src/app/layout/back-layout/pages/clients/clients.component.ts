import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '../../../../services/admin-data.service';
import { ToastServiceService } from '../../../../services/toast-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  allClients: Client[] = [];
  filteredClients: Client[] = [];
  searchQuery = '';
  activeStatus = 'all';
  loading = true;
  selectedStudent: any = null;

  statusFilters = ['all', 'active', 'inactive'];

  currentPage = 1;
  readonly pageSize = 6;


  private readonly colors = [
    '#fde8d8', '#e8f0dd', '#fff3e0', '#fce4ec',
    '#e8eaf6', '#f9fbe7', '#e0f7fa', '#fbe9e7'
  ];
  private rawMap = new Map<number, any>();
  private readonly apiBase = 'http://localhost:8090/peakwell/student';

  constructor(
    private http: HttpClient,
    public toastService: ToastServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${this.apiBase}/all`).subscribe({
      next: students => {
        students.forEach((s, i) => this.rawMap.set(s.id, s));
        this.allClients = students.map((s, i) => this.toCard(s, i));
        this.filteredClients = this.allClients;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.show('⚠️ Could not load students from server');
      }
    });
  }

  private toCard(s: any, i: number): Client {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Unknown';
    const initials = ((s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')).toUpperCase() || '?';
    const bmi = s.bmi ? Math.round(s.bmi * 10) / 10 : 0;
    return {
      id: s.id,
      name,
      goal: s.goal ?? 'Not set',
      calories: s.weight ?? 0,
      adherence: bmi,
      lastSeen: s.activityLevel ?? '—',
      status: s.enabled ? 'active' : 'inactive',
      avatarColor: this.colors[i % this.colors.length],
      initials,
      duration: s.activityLevel ?? '—',
      nextAppointment: s.profileCompleted ? 'Profile complete' : 'Pending profile',
    };
  }

  onSearch(): void { this.applyFilters(); }

  setStatus(status: string): void {
    this.activeStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    let results = this.allClients;
    if (this.activeStatus !== 'all') {
      results = results.filter(c => c.status === this.activeStatus);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) || c.goal.toLowerCase().includes(q)
      );
    }
    this.filteredClients = results;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClients.length / this.pageSize);
  }

  get pagedClients(): Client[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      active: '#7a9e7e', inactive: '#b5aaa5', waitlist: '#c96a3f'
    };
    return map[status] ?? '#b5aaa5';
  }

  viewProfile(client: Client): void {
    const raw = this.rawMap.get(client.id);
    if (raw) this.selectedStudent = { ...raw, avatarHint: client.avatarColor };
  }

  closeProfile(): void { this.selectedStudent = null; }

  openDossier(client: Client): void {
    this.router.navigate(['/admin/dossier', client.id]);
  }

  openMealPlan(client: Client): void {
    this.toastService.show(`📋 Opening meal plan for: ${client.name}`);
  }

  openDossierFromModal(): void {
    if (this.selectedStudent) {
      this.router.navigate(['/admin/dossier', this.selectedStudent.id]);
      this.closeProfile();
    }
  }

  openMealPlanFromModal(): void {
    if (this.selectedStudent) {
      this.toastService.show(`📋 Opening meal plan for: ${this.selectedStudent.firstName}`);
      this.closeProfile();
    }
  }

  bmiLabel(bmi: number): string {
    if (!bmi) return '—';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  bmiColor(bmi: number): string {
    if (!bmi) return '#c5bdb7';
    if (bmi < 18.5) return '#4ab8f0';
    if (bmi < 25)   return '#7a9e7e';
    if (bmi < 30)   return '#e88f68';
    return '#c96a3f';
  }
}
