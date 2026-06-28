import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DossierService } from '../../services/dossier.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';
import { BiometricResponse, MedicalProfileResponse } from '../../services/api.service';

@Component({
  selector: 'app-health-report',
  templateUrl: './health-report.component.html',
  styleUrls: ['./health-report.component.scss']
})
export class HealthReportComponent implements OnInit {
  profile: MedicalProfileResponse | null = null;
  entries: BiometricResponse[] = [];
  goals: any[] = [];
  hasData    = false;
  generating = false;
  reportGenerated = false;

  doctorNotes = '';

  includeSections = {
    profile:         true,
    biometrics:      true,
    trends:          true,
    alerts:          true,
    goals:           true,
    recommendations: true,
  };

  reportPeriod = 'all';
  periods = [
    { value: 'all',     label: 'All time'      },
    { value: '3months', label: 'Last 3 months' },
    { value: '6months', label: 'Last 6 months' },
    { value: '1year',   label: 'Last year'     },
  ];

  constructor(
    private dossierService: DossierService,
    private toastService: ToastServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.dossierService.profile$.subscribe(p => {
      this.profile = p;
      this.hasData = this.entries.length > 0 && !!p;
    });
    this.dossierService.entries$.subscribe(entries => {
      this.entries = entries;
      this.hasData = entries.length > 0 && !!this.profile;
    });
    this.http.get<any[]>('http://localhost:8090/peakwell/api/goals').subscribe({
      next: g  => { this.goals = g; },
      error: () => { this.goals = []; }
    });
  }

  get selectedSectionCount(): number {
    return Object.values(this.includeSections).filter(v => v).length;
  }

  get filteredEntries(): BiometricResponse[] {
    if (this.reportPeriod === 'all') return this.entries;
    const now = new Date();
    let cutoff: Date;
    switch (this.reportPeriod) {
      case '3months': cutoff = new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate()); break;
      case '6months': cutoff = new Date(now.getFullYear(), now.getMonth() - 6,  now.getDate()); break;
      case '1year':   cutoff = new Date(now.getFullYear() - 1, now.getMonth(),  now.getDate()); break;
      default:        return this.entries;
    }
    return this.entries.filter(e => new Date(e.recordedAt) >= cutoff);
  }

  generateReport(): void {
    this.generating = true;
    setTimeout(() => {
      this.downloadPDF();
      this.generating = false;
      this.reportGenerated = true;
      this.toastService.show('📄 Health report downloaded!');
    }, 1200);
  }

  private downloadPDF(): void {
    const entries = this.filteredEntries;
    const latest  = entries.length ? entries[entries.length - 1] : null;
    const first   = entries.length ? entries[0] : null;
    const bmiCat  = latest ? this.dossierService.getBMICategory(latest.bmi) : null;
    const p       = this.profile!;
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
    const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PeakWell Health Report — ${p.firstName} ${p.lastName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Jost', 'Segoe UI', Arial, sans-serif; color: #1e1a16; line-height: 1.6; background: #fff; }

    /* ── COVER PAGE ─────────────────────────────── */
    .cover {
      min-height: 100vh; display: flex; flex-direction: column;
      background: linear-gradient(160deg, #1e1a16 0%, #3a2e25 50%, #c96a3f 100%);
      color: #fff; padding: 60px 64px; position: relative; overflow: hidden;
      page-break-after: always;
    }
    .cover::before {
      content: ''; position: absolute; top: -120px; right: -120px;
      width: 500px; height: 500px; border-radius: 50%;
      background: rgba(255,255,255,0.04); pointer-events: none;
    }
    .cover::after {
      content: ''; position: absolute; bottom: -80px; left: -80px;
      width: 340px; height: 340px; border-radius: 50%;
      background: rgba(255,255,255,0.03); pointer-events: none;
    }
    .cover-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .cover-brand { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 0.5px; }
    .cover-brand span { color: #e8a878; }
    .cover-badge { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 100px; }
    .cover-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 0 40px; }
    .cover-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #e8a878; margin-bottom: 16px; }
    .cover-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 52px; font-weight: 700; line-height: 1.1; color: #fff; margin-bottom: 8px; }
    .cover-title em { color: #e8a878; font-style: italic; }
    .cover-sub { font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.6); margin-top: 12px; }
    .cover-patient {
      display: flex; align-items: center; gap: 24px; margin-top: 48px;
      padding: 28px 32px; background: rgba(255,255,255,0.08); border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(4px);
    }
    .cover-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #c96a3f, #e8a878);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; color: #fff; flex-shrink: 0;
      font-family: 'Cormorant Garamond', serif;
    }
    .cover-patient-info { flex: 1; }
    .cover-patient-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #fff; }
    .cover-patient-meta { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 4px; }
    .cover-patient-tags { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .cover-tag { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 100px; }
    .cover-tag--gender { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.85); }
    .cover-tag--blood { background: rgba(201,106,63,0.35); color: #e8a878; border: 1px solid rgba(201,106,63,0.4); }
    .cover-tag--age { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .cover-date-block { text-align: right; }
    .cover-date-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.4); }
    .cover-date-val { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.75); margin-top: 4px; }
    .cover-stats { display: flex; gap: 0; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 28px; }
    .cover-stat { flex: 1; text-align: center; padding: 0 20px; border-right: 1px solid rgba(255,255,255,0.08); }
    .cover-stat:last-child { border-right: none; }
    .cover-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: #e8a878; display: block; }
    .cover-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.4); }

    /* ── PAGE LAYOUT ────────────────────────────── */
    .report-page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }

    /* ── SECTIONS ───────────────────────────────── */
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px; padding-bottom: 12px;
      border-bottom: 2px solid #f0ebe5;
    }
    .section-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .section-icon--profile    { background: rgba(201,106,63,0.1); }
    .section-icon--biometrics { background: rgba(74,184,240,0.1); }
    .section-icon--trends     { background: rgba(122,158,126,0.1); }
    .section-icon--alerts     { background: rgba(232,143,104,0.1); }
    .section-icon--goals      { background: rgba(164,124,240,0.1); }
    .section-icon--recs       { background: rgba(122,158,126,0.1); }
    .section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: #1e1a16; }
    .section-count { margin-left: auto; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #b5aaa5; text-transform: uppercase; }

    /* ── PROFILE GRID ───────────────────────────── */
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #f0ebe5; border-radius: 14px; overflow: hidden; }
    .profile-cell { padding: 14px 20px; border-bottom: 1px solid #f7f3ef; border-right: 1px solid #f7f3ef; }
    .profile-cell:nth-child(2n) { border-right: none; }
    .profile-cell:nth-last-child(-n+2) { border-bottom: none; }
    .profile-cell-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b5aaa5; margin-bottom: 4px; }
    .profile-cell-value { font-size: 15px; font-weight: 600; color: #1e1a16; }

    .tags-block { margin-top: 20px; }
    .tags-section { margin-bottom: 14px; }
    .tags-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b5aaa5; margin-bottom: 8px; }
    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { padding: 4px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; }
    .tag--allergy    { background: #fde8d8; color: #a85430; }
    .tag--condition  { background: #ede8fe; color: #7a4eb0; }
    .tag--medication { background: #e8f0dd; color: #4a7a4e; }

    /* ── METRICS GRID ───────────────────────────── */
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .metric-card {
      padding: 20px 16px; border-radius: 14px; border: 1.5px solid #f0ebe5;
      background: #faf7f4; text-align: center;
    }
    .metric-value { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; line-height: 1; }
    .metric-unit { font-size: 12px; font-weight: 500; color: #8a7e78; margin-left: 2px; }
    .metric-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #b5aaa5; margin-top: 6px; }
    .metric-badge { font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 100px; margin-top: 8px; display: inline-block; }

    /* ── TABLE ──────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 4px; border-radius: 12px; overflow: hidden; border: 1px solid #f0ebe5; }
    thead tr { background: #1e1a16; }
    th { padding: 11px 14px; text-align: left; font-weight: 700; color: rgba(255,255,255,0.7); font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; }
    tbody tr:nth-child(even) { background: #faf7f4; }
    tbody tr:nth-child(odd)  { background: #fff; }
    td { padding: 10px 14px; border-bottom: 1px solid #f5f1ed; color: #2d2d2d; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    .trend-up   { color: #c96a3f; font-weight: 700; }
    .trend-down { color: #7a9e7e; font-weight: 700; }
    .td-muted   { color: #c5bdb7; }

    .summary-bar {
      margin-top: 14px; padding: 14px 20px; background: #faf7f4;
      border-radius: 10px; font-size: 13px; border: 1px solid #f0ebe5;
      display: flex; gap: 20px; align-items: center;
    }
    .summary-bar strong { color: #1e1a16; }
    .summary-bar .sep { color: #e0d8d0; }

    /* ── ALERTS ─────────────────────────────────── */
    .alert { padding: 14px 18px; border-radius: 10px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 12px; }
    .alert-danger  { background: rgba(201,106,63,0.07); border: 1px solid rgba(201,106,63,0.2); }
    .alert-warning { background: rgba(232,143,104,0.07); border: 1px solid rgba(232,143,104,0.2); }
    .alert-info    { background: rgba(122,158,126,0.07); border: 1px solid rgba(122,158,126,0.2); }
    .alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
    .alert-dot--danger  { background: #c96a3f; }
    .alert-dot--warning { background: #e88f68; }
    .alert-dot--info    { background: #7a9e7e; }
    .alert-metric { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .alert-msg { font-size: 13px; color: #5a5048; margin-top: 2px; }
    .alert-val { font-size: 12px; font-weight: 700; color: #1e1a16; margin-top: 4px; }

    /* ── GOALS ──────────────────────────────────── */
    .goal-item { padding: 16px 20px; border-radius: 12px; background: #faf7f4; border: 1px solid #f0ebe5; margin-bottom: 10px; }
    .goal-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .goal-name { font-size: 14px; font-weight: 700; color: #1e1a16; }
    .goal-meta { font-size: 11px; color: #8a7e78; margin-top: 2px; }
    .goal-pill { font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; }
    .goal-pill--active   { background: rgba(122,158,126,0.15); color: #4a7a4e; }
    .goal-pill--achieved { background: rgba(74,184,240,0.12); color: #2a78b0; }
    .goal-pill--inactive { background: rgba(181,170,165,0.15); color: #8a7e78; }
    .progress-track { height: 6px; background: #ede8e3; border-radius: 3px; margin-top: 14px; overflow: hidden; }
    .progress-fill  { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .goal-numbers { display: flex; justify-content: space-between; font-size: 11px; color: #8a7e78; margin-top: 6px; }
    .milestone-row { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
    .milestone-chip {
      font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 100px;
      border: 1px solid #ede8e3; color: #8a7e78; background: #fff;
    }
    .milestone-chip--reached { background: rgba(122,158,126,0.1); border-color: rgba(122,158,126,0.3); color: #4a7a4e; }

    /* ── RECOMMENDATIONS ────────────────────────── */
    .rec-item { padding: 14px 18px; border-radius: 10px; border: 1px solid #f0ebe5; margin-bottom: 10px; display: flex; gap: 14px; align-items: flex-start; }
    .rec-area-badge { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 100px; flex-shrink: 0; margin-top: 2px; white-space: nowrap; }
    .rec-text { font-size: 13px; color: #3a3530; line-height: 1.6; }

    /* ── DOCTOR NOTES ───────────────────────────── */
    .notes-box { padding: 20px 24px; border: 1.5px solid #f0ebe5; border-radius: 12px; background: #fdfbf9; font-size: 13px; color: #3a3530; line-height: 1.8; white-space: pre-wrap; min-height: 60px; }

    /* ── FOOTER ─────────────────────────────────── */
    .report-footer {
      margin-top: 48px; padding: 24px 56px; text-align: center;
      border-top: 2px solid #f0ebe5; font-size: 11px; color: #b5aaa5;
      line-height: 1.8;
    }
    .report-footer strong { color: #8a7e78; }

    @media print {
      .cover { min-height: 100vh; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- ── COVER PAGE ──────────────────────────────────── -->
  <div class="cover">
    <div class="cover-top">
      <div class="cover-brand">Nourish <span>&</span> Bloom</div>
      <div class="cover-badge">Confidential Health Record</div>
    </div>

    <div class="cover-mid">
      <div class="cover-eyebrow">PeakWell Platform</div>
      <div class="cover-title">Personal Health<br><em>Report</em></div>
      <div class="cover-sub">Comprehensive Medical &amp; Biometric Summary</div>

      <div class="cover-patient">
        <div class="cover-avatar">${initials}</div>
        <div class="cover-patient-info">
          <div class="cover-patient-name">${p.firstName} ${p.lastName}</div>
          <div class="cover-patient-meta">Medical Record · Generated ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div class="cover-patient-tags">
            ${p.gender ? `<span class="cover-tag cover-tag--gender">${p.gender}</span>` : ''}
            ${p.bloodType ? `<span class="cover-tag cover-tag--blood">${p.bloodType}</span>` : ''}
            ${age !== null ? `<span class="cover-tag cover-tag--age">${age} years old</span>` : ''}
          </div>
        </div>
        <div class="cover-date-block">
          <div class="cover-date-label">Report Date</div>
          <div class="cover-date-val">${dateStr}</div>
        </div>
      </div>

      <div class="cover-stats">
        <div class="cover-stat">
          <span class="cover-stat-val">${entries.length}</span>
          <span class="cover-stat-label">Measurements</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-val">${this.goals.length}</span>
          <span class="cover-stat-label">Health Goals</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-val">${this.selectedSectionCount}</span>
          <span class="cover-stat-label">Sections</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-val">${this.reportPeriod === 'all' ? '∞' : this.reportPeriod}</span>
          <span class="cover-stat-label">Period</span>
        </div>
      </div>
    </div>
  </div>

  <div class="report-page">`;

    // ── PATIENT PROFILE ──────────────────────────────────
    if (this.includeSections.profile) {
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--profile">👤</div>
        <div class="section-title">Patient Profile</div>
        <div class="section-count">Personal Information</div>
      </div>
      <div class="profile-grid">
        <div class="profile-cell"><div class="profile-cell-label">Full Name</div><div class="profile-cell-value">${p.firstName} ${p.lastName}</div></div>
        <div class="profile-cell"><div class="profile-cell-label">Date of Birth</div><div class="profile-cell-value">${p.dateOfBirth || '—'}${age !== null ? ` (${age} yrs)` : ''}</div></div>
        <div class="profile-cell"><div class="profile-cell-label">Gender</div><div class="profile-cell-value" style="text-transform:capitalize">${p.gender || '—'}</div></div>
        <div class="profile-cell"><div class="profile-cell-label">Blood Type</div><div class="profile-cell-value">${p.bloodType || '—'}</div></div>
        <div class="profile-cell"><div class="profile-cell-label">Height</div><div class="profile-cell-value">${p.height ? p.height + ' cm' : '—'}</div></div>
        <div class="profile-cell"><div class="profile-cell-label">Emergency Contact</div><div class="profile-cell-value">${p.emergencyContact || '—'}</div></div>
      </div>`;

      const hasTags = p.allergies?.length || p.conditions?.length || p.medications?.length;
      if (hasTags) {
        html += `<div class="tags-block">`;
        if (p.allergies?.length) {
          html += `<div class="tags-section"><div class="tags-label">Allergies</div><div class="tag-list">${p.allergies.map(a => `<span class="tag tag--allergy">${a}</span>`).join('')}</div></div>`;
        }
        if (p.conditions?.length) {
          html += `<div class="tags-section"><div class="tags-label">Diagnosed Conditions</div><div class="tag-list">${p.conditions.map(c => `<span class="tag tag--condition">${c}</span>`).join('')}</div></div>`;
        }
        if (p.medications?.length) {
          html += `<div class="tags-section"><div class="tags-label">Current Medications</div><div class="tag-list">${p.medications.map(m => `<span class="tag tag--medication">${m}</span>`).join('')}</div></div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    // ── CURRENT BIOMETRICS ───────────────────────────────
    if (this.includeSections.biometrics && latest) {
      const bmiColor = bmiCat?.color || '#8a7e78';
      const bmiLabel = bmiCat?.label || '';
      const bmiLightBg = bmiColor + '18';
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--biometrics">📊</div>
        <div class="section-title">Current Biometric Summary</div>
        <div class="section-count">Recorded ${new Date(latest.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value" style="color:#c96a3f">${latest.weight}<span class="metric-unit">kg</span></div>
          <div class="metric-label">Weight</div>
          ${first && first !== latest ? `<div class="metric-badge" style="background:${latest.weight <= first.weight ? 'rgba(122,158,126,0.12)' : 'rgba(201,106,63,0.1)'};color:${latest.weight <= first.weight ? '#4a7a4e' : '#c96a3f'}">${latest.weight <= first.weight ? '▼' : '▲'} ${Math.abs(Math.round((latest.weight - first.weight)*10)/10)} kg since start</div>` : ''}
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color:${bmiColor}">${latest.bmi}</div>
          <div class="metric-label">BMI</div>
          <div class="metric-badge" style="background:${bmiLightBg};color:${bmiColor}">${bmiLabel}</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color:#e88f68">${latest.bodyFat ?? '—'}${latest.bodyFat != null ? '<span class="metric-unit">%</span>' : ''}</div>
          <div class="metric-label">Body Fat</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color:#7a9e7e">${latest.muscleMass ?? '—'}${latest.muscleMass != null ? '<span class="metric-unit">kg</span>' : ''}</div>
          <div class="metric-label">Muscle Mass</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color:#a47cf0;font-size:24px">${latest.systolic ? latest.systolic + '/' + latest.diastolic : '—'}${latest.systolic ? '<span class="metric-unit">mmHg</span>' : ''}</div>
          <div class="metric-label">Blood Pressure</div>
          ${latest.systolic ? `<div class="metric-badge" style="background:${latest.systolic > 140 ? 'rgba(201,106,63,0.1)' : latest.systolic > 130 ? 'rgba(232,143,104,0.1)' : 'rgba(122,158,126,0.1)'};color:${latest.systolic > 140 ? '#c96a3f' : latest.systolic > 130 ? '#e88f68' : '#4a7a4e'}">${latest.systolic > 140 ? 'High' : latest.systolic > 130 ? 'Elevated' : 'Normal'}</div>` : ''}
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color:#4ab8f0">${latest.glucose ?? '—'}${latest.glucose != null ? '<span class="metric-unit">mg/dL</span>' : ''}</div>
          <div class="metric-label">Fasting Glucose</div>
          ${latest.glucose ? `<div class="metric-badge" style="background:${latest.glucose > 126 ? 'rgba(201,106,63,0.1)' : latest.glucose > 100 ? 'rgba(232,143,104,0.1)' : 'rgba(122,158,126,0.1)'};color:${latest.glucose > 126 ? '#c96a3f' : latest.glucose > 100 ? '#e88f68' : '#4a7a4e'}">${latest.glucose > 126 ? 'Diabetic' : latest.glucose > 100 ? 'Pre-diabetic' : 'Normal'}</div>` : ''}
        </div>
      </div>
    </div>`;
    }

    // ── MEASUREMENT HISTORY ──────────────────────────────
    if (this.includeSections.trends && entries.length > 0) {
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--trends">📈</div>
        <div class="section-title">Measurement History</div>
        <div class="section-count">${entries.length} Records</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Weight</th><th>BMI</th><th>Body Fat</th><th>Blood Pressure</th><th>Glucose</th></tr></thead>
        <tbody>`;
      for (let i = 0; i < entries.length; i++) {
        const e    = entries[i];
        const prev = i > 0 ? entries[i - 1] : null;
        const date = new Date(e.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const wTrend = prev ? (e.weight > prev.weight ? `<span class="trend-up"> ▲</span>` : e.weight < prev.weight ? `<span class="trend-down"> ▼</span>` : '') : '';
        const bTrend = prev ? (e.bmi > prev.bmi ? `<span class="trend-up"> ▲</span>` : e.bmi < prev.bmi ? `<span class="trend-down"> ▼</span>` : '') : '';
        html += `<tr>
          <td>${date}</td>
          <td>${e.weight} kg${wTrend}</td>
          <td>${e.bmi}${bTrend}</td>
          <td>${e.bodyFat != null ? e.bodyFat + '%' : '<span class="td-muted">—</span>'}</td>
          <td>${e.systolic ? e.systolic + '/' + e.diastolic + ' mmHg' : '<span class="td-muted">—</span>'}</td>
          <td>${e.glucose != null ? e.glucose + ' mg/dL' : '<span class="td-muted">—</span>'}</td>
        </tr>`;
      }
      html += `</tbody></table>`;
      if (first && latest && first !== latest) {
        const wc = Math.round((latest.weight - first.weight) * 10) / 10;
        const bc = Math.round((latest.bmi   - first.bmi)    * 10) / 10;
        html += `
        <div class="summary-bar">
          <strong>Period Summary</strong> <span class="sep">|</span>
          Weight change: <strong style="color:${wc <= 0 ? '#7a9e7e' : '#c96a3f'}">${wc > 0 ? '+' : ''}${wc} kg</strong>
          <span class="sep">|</span>
          BMI change: <strong style="color:${bc <= 0 ? '#7a9e7e' : '#c96a3f'}">${bc > 0 ? '+' : ''}${bc}</strong>
          <span class="sep">|</span>
          Measurements: <strong>${entries.length}</strong>
        </div>`;
      }
      html += `</div>`;
    }

    // ── HEALTH ALERTS ────────────────────────────────────
    if (this.includeSections.alerts && latest) {
      const alerts = this.generateAlerts(entries);
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--alerts">⚠️</div>
        <div class="section-title">Health Alerts</div>
        <div class="section-count">${alerts.length} Flag${alerts.length !== 1 ? 's' : ''}</div>
      </div>`;
      for (const a of alerts) {
        html += `
      <div class="alert alert-${a.type}">
        <div class="alert-dot alert-dot--${a.type}"></div>
        <div>
          <div class="alert-metric">${a.metric}</div>
          <div class="alert-msg">${a.message}</div>
          <div class="alert-val">${a.value}</div>
        </div>
      </div>`;
      }
      html += `</div>`;
    }

    // ── HEALTH GOALS ─────────────────────────────────────
    if (this.includeSections.goals && this.goals.length > 0) {
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--goals">🎯</div>
        <div class="section-title">Health Goals</div>
        <div class="section-count">${this.goals.length} Goal${this.goals.length !== 1 ? 's' : ''}</div>
      </div>`;
      for (const goal of this.goals) {
        const progress = this.getGoalProgress(goal);
        const fillColor = goal.achieved ? '#4ab8f0' : goal.active ? '#7a9e7e' : '#b5aaa5';
        const statusLabel = goal.achieved ? 'Achieved' : goal.active ? 'Active' : 'Inactive';
        const statusClass = goal.achieved ? 'achieved' : goal.active ? 'active' : 'inactive';
        const reachedMilestones = (goal.milestones || []).filter((m: any) => m.reached).length;
        html += `
      <div class="goal-item">
        <div class="goal-top">
          <div>
            <div class="goal-name">${goal.metric?.replace(/([A-Z])/g, ' $1').trim() ?? '—'} · ${goal.direction ?? ''}</div>
            <div class="goal-meta">Start: ${goal.startValue} ${goal.unit} → Target: ${goal.targetValue} ${goal.unit} · Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
          </div>
          <div class="goal-pill goal-pill--${statusClass}">${statusLabel}</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(progress, 100)}%;background:${fillColor}"></div>
        </div>
        <div class="goal-numbers">
          <span>Progress: ${progress}%</span>
          <span>${reachedMilestones}/${(goal.milestones || []).length} milestones</span>
        </div>
        ${goal.milestones?.length ? `
        <div class="milestone-row">
          ${goal.milestones.map((m: any) => `<span class="milestone-chip${m.reached ? ' milestone-chip--reached' : ''}">${m.reached ? '✓ ' : ''}${m.label}</span>`).join('')}
        </div>` : ''}
      </div>`;
      }
      html += `</div>`;
    }

    // ── AI RECOMMENDATIONS ───────────────────────────────
    if (this.includeSections.recommendations && latest) {
      const recs = this.generateRecommendations(latest);
      const recColors: Record<string, string> = {
        'Nutrition': '#c96a3f', 'Cardiovascular': '#a47cf0', 'Metabolic': '#4ab8f0',
        'Hydration': '#7a9e7e', 'Activity': '#e88f68', 'Sleep': '#c8883a', 'Body Composition': '#7a9e7e'
      };
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--recs">💡</div>
        <div class="section-title">Personalized Recommendations</div>
        <div class="section-count">${recs.length} Suggestions</div>
      </div>`;
      for (const rec of recs) {
        const color = recColors[rec.area] || '#8a7e78';
        html += `
      <div class="rec-item">
        <span class="rec-area-badge" style="background:${color}18;color:${color}">${rec.area}</span>
        <span class="rec-text">${rec.text}</span>
      </div>`;
      }
      html += `</div>`;
    }

    // ── DOCTOR NOTES ─────────────────────────────────────
    if (this.doctorNotes.trim()) {
      html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon section-icon--recs">📝</div>
        <div class="section-title">Notes for Doctor</div>
      </div>
      <div class="notes-box">${this.doctorNotes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>`;
    }

    html += `
  </div>

  <div class="report-footer">
    <p><strong>PeakWell — Nourish &amp; Bloom Health Platform</strong></p>
    <p>This report was generated on ${dateStr} and is intended for personal health tracking purposes only.</p>
    <p>This document does not constitute medical advice. Please consult your healthcare provider for clinical decisions.</p>
  </div>

</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
        }, 400);
      });
    }
  }

  private getGoalProgress(goal: any): number {
    const latest = this.dossierService.latest;
    if (!latest) return 0;
    const current: Record<string, number | null> = {
      weight: latest.weight, bmi: latest.bmi, bodyFat: latest.bodyFat,
      muscleMass: latest.muscleMass, systolic: latest.systolic, glucose: latest.glucose
    };
    const curr = current[goal.metric];
    if (curr == null || goal.startValue == null || goal.targetValue == null) return 0;
    const total = Math.abs(goal.targetValue - goal.startValue);
    if (total === 0) return 100;
    const done  = Math.abs(curr - goal.startValue);
    return Math.min(Math.round((done / total) * 100), 100);
  }

  private generateAlerts(entries: BiometricResponse[]): Array<{type: string; metric: string; message: string; value: string}> {
    const alerts: Array<{type: string; metric: string; message: string; value: string}> = [];
    if (!entries.length) return alerts;
    const latest = entries[entries.length - 1];
    const prev   = entries.length >= 2 ? entries[entries.length - 2] : null;

    if (prev) {
      const diff = Math.round((latest.weight - prev.weight) * 10) / 10;
      if (diff > 2)  alerts.push({ type: 'danger',  metric: 'Weight', message: `Rapid gain of +${diff} kg since last measurement`, value: `${latest.weight} kg` });
      else if (diff < -3) alerts.push({ type: 'warning', metric: 'Weight', message: `Rapid loss of ${diff} kg since last measurement`, value: `${latest.weight} kg` });
    }
    if (latest.bmi >= 30)          alerts.push({ type: 'danger',  metric: 'BMI',            message: 'BMI is in the obese range',                    value: `${latest.bmi}` });
    else if (latest.bmi >= 25)     alerts.push({ type: 'warning', metric: 'BMI',            message: 'BMI is in the overweight range',               value: `${latest.bmi}` });
    if (latest.systolic && latest.systolic > 140) alerts.push({ type: 'danger',  metric: 'Blood Pressure', message: 'Hypertension — consult your doctor',      value: `${latest.systolic}/${latest.diastolic} mmHg` });
    else if (latest.systolic && latest.systolic > 130) alerts.push({ type: 'warning', metric: 'Blood Pressure', message: 'Elevated blood pressure',                value: `${latest.systolic}/${latest.diastolic} mmHg` });
    if (latest.glucose && latest.glucose > 126)  alerts.push({ type: 'danger',  metric: 'Glucose',         message: 'Fasting glucose in diabetic range',        value: `${latest.glucose} mg/dL` });
    else if (latest.glucose && latest.glucose > 100) alerts.push({ type: 'warning', metric: 'Glucose',         message: 'Pre-diabetic glucose level',               value: `${latest.glucose} mg/dL` });
    if (latest.bodyFat && latest.bodyFat > 32)   alerts.push({ type: 'warning', metric: 'Body Fat',        message: 'Body fat percentage above healthy range',  value: `${latest.bodyFat}%` });

    if (!alerts.length) alerts.push({ type: 'info', metric: 'General Health', message: 'All recorded values are within healthy ranges', value: '✓ Normal' });
    return alerts;
  }

  private generateRecommendations(latest: BiometricResponse): Array<{area: string; text: string}> {
    const recs: Array<{area: string; text: string}> = [];
    if (latest.bmi > 25)       recs.push({ area: 'Nutrition',          text: 'Consider reducing daily caloric intake by 300–500 kcal. Prioritize fiber-rich foods, lean proteins, and limit processed carbohydrates.' });
    if (latest.bmi < 18.5)     recs.push({ area: 'Nutrition',          text: 'Increase caloric intake with nutrient-dense foods: avocado, nuts, legumes, whole grains. Consider consulting a registered dietitian.' });
    if (latest.systolic && latest.systolic > 130) recs.push({ area: 'Cardiovascular',     text: 'Reduce sodium intake below 1,500 mg/day, increase potassium-rich foods (bananas, sweet potato), and practice daily stress management.' });
    if (latest.glucose && latest.glucose > 100)   recs.push({ area: 'Metabolic',          text: 'Adopt a low-glycemic diet, increase soluble fiber (oats, legumes), and take a 15-minute walk after each meal.' });
    if (latest.bodyFat && latest.bodyFat > 30)    recs.push({ area: 'Body Composition',   text: 'Combine resistance training (2–3×/week) with a moderate caloric deficit to reduce body fat while preserving muscle mass.' });
    recs.push({ area: 'Hydration', text: `Aim for ${Math.round(latest.weight * 0.033 * 10) / 10}L of water per day based on your current weight of ${latest.weight} kg.` });
    recs.push({ area: 'Activity',  text: 'Maintain at least 150 minutes of moderate-intensity aerobic activity per week, plus 2 strength training sessions.' });
    recs.push({ area: 'Sleep',     text: 'Prioritize 7–9 hours of quality sleep per night. Poor sleep directly impacts metabolism, cortisol, and recovery.' });
    return recs;
  }
}