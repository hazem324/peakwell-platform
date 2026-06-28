import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CaptchaChallenge, CaptchaService } from '../../../../services/captcha.service';

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.scss']
})
export class CaptchaComponent implements OnInit {

  // Emits JWT string when user passes, null when failed/reset
  @Output() captchaTokenChange = new EventEmitter<string | null>();

  challenge: CaptchaChallenge | null = null;
  selected = new Set<number>();
  state: 'loading' | 'idle' | 'verifying' | 'success' | 'error' = 'loading';
  errorMsg = '';

  constructor(private captchaService: CaptchaService) {}

  ngOnInit(): void {
    this.loadChallenge();
  }

  loadChallenge(): void {
    this.state = 'loading';
    this.selected.clear();
    this.errorMsg = '';
    this.captchaTokenChange.emit(null); // tell parent: token is gone → disable button

    this.captchaService.getChallenge().subscribe({
      next: c  => { this.challenge = c; this.state = 'idle'; },
      error: () => { this.state = 'error'; this.errorMsg = 'Could not load challenge.'; }
    });
  }

  toggle(index: number): void {
    if (this.state !== 'idle') return;
    this.selected.has(index)
      ? this.selected.delete(index)
      : this.selected.add(index);
  }

  isSelected(index: number): boolean {
    return this.selected.has(index);
  }

  verify(): void {
    if (!this.challenge || this.selected.size === 0) return;
    this.state = 'verifying';

    this.captchaService.verify(
      this.challenge.challengeToken,
      [...this.selected]
    ).subscribe({
      next: res => {
        if (res.success && res.captchaToken) {
          this.state = 'success';
          this.captchaTokenChange.emit(res.captchaToken); //  enable signup button
        } else {
          this.state = 'idle';
          this.errorMsg = 'Wrong selection — please try again.';
          this.captchaTokenChange.emit(null); // keep button disabled
          setTimeout(() => this.loadChallenge(), 1200);
        }
      },
      error: () => {
        this.state = 'idle';
        this.errorMsg = 'Verification failed — please try again.';
        this.captchaTokenChange.emit(null);
        setTimeout(() => this.loadChallenge(), 1200);
      }
    });
  }
}