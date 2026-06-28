import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface ToastState {
  message: string;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastServiceService {

  private _toast = new BehaviorSubject<ToastState>({ message: '', visible: false });
  toast$ = this._toast.asObservable();

  private timer: any;

  show(message: string, duration = 3000): void {
    clearTimeout(this.timer);
    this._toast.next({ message, visible: true });
    this.timer = setTimeout(() => {
      this._toast.next({ message, visible: false });
    }, duration);
  }
}
