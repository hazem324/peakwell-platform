import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoalStateService {
  private readonly _changed$ = new Subject<void>();
  readonly changed$ = this._changed$.asObservable();

  notify(): void { this._changed$.next(); }
}
