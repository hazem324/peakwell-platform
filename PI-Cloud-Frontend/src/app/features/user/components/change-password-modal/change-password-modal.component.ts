import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrl: './change-password-modal.component.scss'
})
export class ChangePasswordModalComponent {

  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  success = false;
  errorMessage = '';

  showOld     = false;
  showNew     = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            )
          ]
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatch }
    );
  }

  // ── Custom validator ───────────────────────────
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np && cp && np !== cp ? { mismatch: true } : null;
  }

  // ── Getters ────────────────────────────────────
  get oldCtrl()     { return this.form.get('oldPassword')!; }
  get newCtrl()     { return this.form.get('newPassword')!; }
  get confirmCtrl() { return this.form.get('confirmPassword')!; }

  // ── Submit ─────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading      = true;
    this.errorMessage = '';

    this.authService.changePassword(
      this.form.value.oldPassword,
      this.form.value.newPassword
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading      = false;
        const status      = err?.status;
        const msg         = err?.error?.message || err?.error || '';

        if (status === 401) {
          this.errorMessage = 'Old password is incorrect. Please try again.';
        } else if (status === 400) {
          this.errorMessage = msg || 'Invalid request. Please check your input.';
        } else if (status === 0) {
          this.errorMessage = 'Cannot reach the server. Please check your connection.';
        } else {
          this.errorMessage = msg || 'Something went wrong. Please try again later.';
        }
      }
    });
  }

  // ── Close ──────────────────────────────────────
  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}