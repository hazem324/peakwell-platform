import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ForgetPasswordRequest } from '../../../../models/auth.model';
import { AppToastService } from '../../../../services/app-toast.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

  forgotForm!: FormGroup;
  loading = false;
  success = false;
  errorMessage = '';

  constructor(
    private toast: AppToastService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.initForm(); //  initialize here
  }

  //  Form initialization method
  private initForm(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // easy access
  get f() {
    return this.forgotForm.controls;
  }

  onSubmit(): void {

  if (this.forgotForm.invalid) {
    this.forgotForm.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const payload: ForgetPasswordRequest = {
    email: this.forgotForm.value.email
  };

  this.authService.forgotPassword(payload).subscribe({

    //  SUCCESS (200)
    next: () => {
      this.loading = false;
      this.success = true;

      this.toast.showSuccess('Reset link sent to your email 📧');
    },

    //  ERRORS (400 / 404 / 500 / 401)
    error: (err) => {
      this.loading = false;

      console.log('ERROR:', err);

      let message = 'Something went wrong. Try again.';

      if (err.status === 404) {
        message = 'User not found';
      } else if (err.status === 400) {
        message = 'Invalid email address';
      } else if (err.status === 401) {
        message = 'Unauthorized request';
      } else if (err.status === 500) {
        message = 'Server error, please try later';
      }

      this.toast.showError(message);

      // optional: still show inline error
      this.errorMessage = message;
    }
  });
}
}

