import { Component, Input, OnChanges } from '@angular/core';
import { MostActiveUser } from  '../../../../services/user-activity.service';


const PALETTE = ['#c96a3f', '#4a7c59', '#b07d3f', '#5a6fa8', '#b94040', '#7a5fa8'];

@Component({
  selector: 'app-activity-most-active',
  templateUrl: './activity-most-active.component.html',
  styleUrl: './activity-most-active.component.scss'
})
export class ActivityMostActiveComponent implements OnChanges {
  @Input() data: MostActiveUser[] = [];
  maxCount = 1;

  ngOnChanges(): void {
    this.maxCount = this.data.length ? Math.max(...this.data.map(u => u.activityCount)) : 1;
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  avatarColor(index: number): string {
    return PALETTE[index % PALETTE.length];
  }
}