import { Component, Input, OnChanges } from '@angular/core';
import { TopIp } from  '../../../../services/user-activity.service';


@Component({
  selector: 'app-activity-top-ips',
  templateUrl: './activity-top-ips.component.html',
  styleUrl: './activity-top-ips.component.scss'
})
export class ActivityTopIpsComponent implements OnChanges {
  @Input() data: TopIp[] = [];
  maxCount = 1;

  ngOnChanges(): void {
    this.maxCount = this.data.length ? Math.max(...this.data.map(d => d.count)) : 1;
  }
}