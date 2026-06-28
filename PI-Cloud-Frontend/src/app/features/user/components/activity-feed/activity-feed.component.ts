import { Component, Input } from '@angular/core';
import { RecentActivity  } from  '../../../../services/user-activity.service';


@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss'
})
export class ActivityFeedComponent {
  @Input() data: RecentActivity[] = [];
 
  getAction(action: string): { icon: string; accent: string; bg: string } {
    const map: Record<string, { icon: string; accent: string; bg: string }> = {
      LOGIN:          { icon: 'fa-solid fa-right-to-bracket', accent: '#4a7c59', bg: 'rgba(74,124,89,0.08)'   },
      LOGIN_FAILED:   { icon: 'fa-solid fa-lock',             accent: '#b94040', bg: 'rgba(185,64,64,0.08)'   },
      LOGOUT:         { icon: 'fa-solid fa-right-from-bracket',accent: '#8a7e78', bg: 'rgba(138,126,120,0.08)' },
      PROFILE_UPDATE: { icon: 'fa-solid fa-user-pen',         accent: '#b07d3f', bg: 'rgba(176,125,63,0.08)'  },
      PASSWORD_CHANGE:{ icon: 'fa-solid fa-key',              accent: '#c96a3f', bg: 'rgba(201,106,63,0.08)'  },
      ADMIN_ACTION:   { icon: 'fa-solid fa-shield-halved',    accent: '#5a6fa8', bg: 'rgba(90,111,168,0.08)'  },
      TASK_CREATED:   { icon: 'fa-solid fa-plus',             accent: '#4a7c59', bg: 'rgba(74,124,89,0.08)'   },
      TASK_UPDATED:   { icon: 'fa-solid fa-pen',              accent: '#b07d3f', bg: 'rgba(176,125,63,0.08)'  },
      TASK_DELETED:   { icon: 'fa-solid fa-trash',            accent: '#b94040', bg: 'rgba(185,64,64,0.08)'   },
    };
    return map[action] ?? { icon: 'fa-solid fa-circle-dot', accent: '#8a7e78', bg: 'rgba(138,126,120,0.08)' };
  }
}