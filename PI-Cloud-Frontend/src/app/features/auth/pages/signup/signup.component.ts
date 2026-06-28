
import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppToastService } from '../../../../services/app-toast.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  signupForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  agreeTerms = false;
  success = false;
  roleDropdownOpen = false;


 roleOptions = [
  { value: 'STUDENT',    label: 'Student'    },
  { value: 'DIETITIAN',  label: 'Dietitian'  },
  { value: 'RESTAURANT', label: 'Restaurant' },
];


toggleRoleDropdown() {
  this.roleDropdownOpen = !this.roleDropdownOpen;
}

selectRole(value: string) {
  this.signupForm.get('role')?.setValue(value);
  this.signupForm.get('role')?.markAsTouched();
  this.roleDropdownOpen = false;
}

getRoleLabel(): string {
  const val = this.f['role'].value;
  return this.roleOptions.find(o => o.value === val)?.label ?? '';
}

@HostListener('document:click', ['$event'])
onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.field-group')) {
    this.roleDropdownOpen = false;
  }
}

  // CAPTCHA 
  captchaToken: string | null = null; // null = button stays disabled

  get captchaPassed(): boolean {
    return this.captchaToken !== null;
  }

    constructor(
    private fb: FormBuilder,
    private router: Router,
    private appToast: AppToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
  this.signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password:[ '',
  [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
  ]
],

    confirmPassword: ['', Validators.required],
    role: ['', Validators.required],
    agreeTerms: [false, Validators.requiredTrue]
  });
}

// ─── Called by <app-captcha (captchaTokenChange)="..."> ─
  onCaptchaTokenChange(token: string | null): void {
    this.captchaToken = token;
  }

   //  getter for easy access
  get f() {
    return this.signupForm.controls;
  }

  //  password match check
  passwordsMatch(): boolean {
    return this.signupForm.value.password === this.signupForm.value.confirmPassword;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signup() {
  if (this.signupForm.invalid || !this.passwordsMatch()) {
    this.appToast.showError('Please fix the form errors');
    return;
  }

  this.loading = true;

  const request = {
    firstName: this.f['firstName'].value,
    lastName: this.f['lastName'].value,
    email: this.f['email'].value,
    password: this.f['password'].value,
    role: this.f['role'].value,
  };

  console.log(request.email);
  this.authService.register(request).subscribe({

    //  SUCCESS HANDLING
    next: (res) => {
      console.log("FULL RESPONSE:", res);

      if (res.status === 201) {
        const message = res.body?.message || 'Account created successfully';
        this.appToast.showSuccess(message);
        this.success = true;

    console.log("SUCCESS STATE:", this.success);

    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 4000);

        
      } else {
        this.appToast.showInfo('Unexpected response from server');
      }

      this.loading = false;
    },

    //  ERROR HANDLING (ALL CASES)
    error: (err) => {
  console.error("FULL ERROR:", err);

  const backendMessage =
    (err.error?.message || err.error?.error || '').toLowerCase();

  let message = 'Signup failed';

  //  HANDLE CASE: EMAIL SENT BUT DUPLICATE IN DB
  if (
    err.status === 409 ||
    (err.status === 500 && backendMessage.includes('duplicate'))
  ) {
    this.appToast.showSuccess('Verification email sent 📧');

    

    this.loading = false;
    return;
  }

  //  NETWORK
  if (err.status === 0) {
    message = 'Cannot connect to server. Check backend or CORS.';
  }

  //  400
  else if (err.status === 400) {
    message = backendMessage || 'Invalid input data';
  }

  //  OTHER ERRORS
  else if (backendMessage) {
    message = backendMessage;
  }

  this.appToast.showError(message);
  this.loading = false;
}
  });
}

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }


  signupWithGoogle() {
    if (!this.captchaPassed) {
      this.appToast.showError('Please complete the CAPTCHA verification first');
      return;
    }
  localStorage.setItem('auth_flow', 'signup');

  this.authService.getGoogleUrl('signup').subscribe(res => {
    window.location.href = res.url;
  });
}


}