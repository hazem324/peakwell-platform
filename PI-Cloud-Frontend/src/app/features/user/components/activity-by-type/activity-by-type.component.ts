import { Component, Input, OnChanges } from '@angular/core';
import { ActivityByType } from  '../../../../services/user-activity.service';
const ACTION_META: Record<string, { label: string; icon: string; accent: string; bg: string }> = {
  LOGIN:           { label: 'Login',           icon: 'fa-solid fa-right-to-bracket',  accent: '#4a7c59', bg: 'rgba(74,124,89,0.08)'   },
  LOGIN_FAILED:    { label: 'Login Failed',    icon: 'fa-solid fa-lock',              accent: '#b94040', bg: 'rgba(185,64,64,0.08)'   },
  LOGOUT:          { label: 'Logout',          icon: 'fa-solid fa-right-from-bracket', accent: '#8a7e78', bg: 'rgba(138,126,120,0.08)' },
  PROFILE_UPDATE:  { label: 'Profile Update',  icon: 'fa-solid fa-user-pen',          accent: '#b07d3f', bg: 'rgba(176,125,63,0.08)'  },
  PASSWORD_CHANGE: { label: 'Password Change', icon: 'fa-solid fa-key',               accent: '#c96a3f', bg: 'rgba(201,106,63,0.08)'  },
  ADMIN_ACTION:    { label: 'Admin Action',    icon: 'fa-solid fa-shield-halved',     accent: '#5a6fa8', bg: 'rgba(90,111,168,0.08)'  },
  TASK_CREATED:    { label: 'Task Created',    icon: 'fa-solid fa-plus',              accent: '#4a7c59', bg: 'rgba(74,124,89,0.08)'   },
  TASK_UPDATED:    { label: 'Task Updated',    icon: 'fa-solid fa-pen',               accent: '#b07d3f', bg: 'rgba(176,125,63,0.08)'  },
  TASK_DELETED:    { label: 'Task Deleted',    icon: 'fa-solid fa-trash',             accent: '#b94040', bg: 'rgba(185,64,64,0.08)'   },
};

@Component({
  selector: 'app-activity-by-type',
  templateUrl: './activity-by-type.component.html',
  styleUrl: './activity-by-type.component.scss'
})
export class ActivityByTypeComponent implements OnChanges {
  @Input() data: ActivityByType[] = [];

  total = 0;
  rows: { label: string; icon: string; accent: string; bg: string; count: number; pct: number }[] = [];

  ngOnChanges(): void {
    if (!this.data?.length) return;
    this.total = this.data.reduce((s, d) => s + d.count, 0);

    this.rows = this.data.map(d => {
      const meta = ACTION_META[d.action] ?? {
        label: d.action, icon: 'fa-solid fa-circle-dot',
        accent: '#8a7e78', bg: 'rgba(138,126,120,0.08)'
      };
      return { ...meta, count: d.count, pct: this.total ? d.count / this.total : 0 };
    });
  }
}