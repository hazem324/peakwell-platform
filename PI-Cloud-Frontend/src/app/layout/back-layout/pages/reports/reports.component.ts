import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  kpis = [
    { label: 'Avg Weight Lost',  value: '3.4 kg', icon: '⚖️', color: '#c96a3f' },
    { label: 'Avg Session Time', value: '42 min',  icon: '⏱️', color: '#7a9e7e' },
    { label: 'Retention Rate',   value: '88%',     icon: '🔄', color: '#e88f68' },
    { label: 'Monthly Revenue',  value: '$9,200',  icon: '💰', color: '#a8c5ac' },
  ];

  adherenceData = [
    { label: 'Sports Nutrition',  value: 91 },
    { label: 'Muscle Gain',       value: 82 },
    { label: 'Weight Loss',       value: 79 },
    { label: 'Heart Health',      value: 74 },
    { label: 'Diabetes Mgmt',     value: 58 },
  ];

  outcomes = [
    { name: 'Maya Johnson',  metric: '-4.2 kg', detail: 'Weight',   good: true  },
    { name: 'Carlos Mena',   metric: '+2.1 kg', detail: 'LBM',      good: true  },
    { name: 'Priya Sharma',  metric: '6.8%',    detail: 'HbA1c',    good: true  },
    { name: 'James Fowler',  metric: '118/78',  detail: 'BP',       good: true  },
    { name: 'Emma Clarke',   metric: '+3.2',    detail: 'VO2max',   good: true  },
  ];
}
