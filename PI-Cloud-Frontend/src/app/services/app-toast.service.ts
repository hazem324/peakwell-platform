import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppToastState {
  message: string;
  visible: boolean;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class AppToastService {

  private _toast = new BehaviorSubject<AppToastState>({
    message: '',
    visible: false,
    type: 'info'
  });

  toast$ = this._toast.asObservable();
  private timer: any;

  private currentId = 0;

private show(message: string, type: 'success' | 'error' | 'info', duration = 3000): void {

  const id = ++this.currentId;

  clearTimeout(this.timer);

  this._toast.next({
    message,
    visible: true,
    type
  });

  this.timer = setTimeout(() => {
    if (id === this.currentId) {
      this._toast.next({ message: '', visible: false, type });
    }
  }, duration);
}

  showSuccess(message: string , duration = 7000) {
    this.show(message, 'success',duration);
  }

  showError(message: string, duration=7000) {
    this.show(message, 'error', duration);
  }

  showInfo(message: string , duration=7000) {
    this.show(message, 'info', duration);
  }
}