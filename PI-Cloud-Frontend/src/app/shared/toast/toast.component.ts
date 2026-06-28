import { Component } from '@angular/core';
import { AppToastService, AppToastState } from '../../services/app-toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {

  toast$!: Observable<AppToastState>;

  constructor(private toastService: AppToastService) {
    this.toast$ = this.toastService.toast$; 
  }
}