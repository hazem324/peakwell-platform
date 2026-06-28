import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppToastService } from '../../../../services/app-toast.service';
import { AuthService } from '../../../../services/auth.service';
import { LoginRequest } from '../../../../models/auth.model';
import { UserService } from '../../../../services/user.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  faceEmailForm!: FormGroup;
  showPassword  = false;
  loading       = false;

  // ─── CAPTCHA ──────────────────────────────────────────────
  captchaToken: string | null = null;
  get captchaPassed(): boolean { return this.captchaToken !== null; }
  onCaptchaTokenChange(token: string | null): void { this.captchaToken = token; }

  // ─── FACE LOGIN STATE ─────────────────────────────────────
  showFaceModal    = false;   // modal visibility
  faceStep: 'camera' | 'email' = 'camera';  // step inside modal
  stream: MediaStream | null   = null;       // webcam stream
  capturedImage: string | null = null;       // base64 snapshot
  faceLoading      = false;
  faceError        = '';

  @ViewChild('videoEl')  videoEl!:  ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService,
    private appToast:    AppToastService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.faceEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // ─── NORMAL LOGIN ─────────────────────────────────────────
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.appToast.showError('Please fill all fields correctly');
      return;
    }
    if (!this.captchaPassed) {
      this.appToast.showError('Please complete the CAPTCHA verification');
      return;
    }

    this.loading = true;
    const data: LoginRequest = this.loginForm.value;

    this.authService.login(data).subscribe({
      next: () => {
        this.appToast.showSuccess('Login successful');
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.captchaToken = null;
          this.appToast.showError('CAPTCHA expired — please verify again.');
          return;
        }
        this.appToast.showError('Login failed');
      }
    });
  }

  // ─── FACE LOGIN — open modal & start camera ───────────────
  openFaceLogin(): void {
    this.showFaceModal = true;
    this.faceStep      = 'camera';
    this.capturedImage = null;
    this.faceError     = '';
    this.faceEmailForm.reset();

    // slight delay so *ngIf renders the video element first
    setTimeout(() => this.startCamera(), 200);
  }

  private startCamera(): void {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        this.stream = stream;
        if (this.videoEl?.nativeElement) {
          this.videoEl.nativeElement.srcObject = stream;
        }
      })
      .catch(() => {
        this.faceError = 'Camera access denied. Please allow camera permission.';
      });
  }

  // ─── Capture photo from video ─────────────────────────────
  capturePhoto(): void {
    const video  = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    // get base64 WITHOUT the data:image/... prefix
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    this.capturedImage = dataUrl.split(',')[1];

    this.stopCamera();
    this.faceStep = 'email';   // proceed to email step
  }

  retakePhoto(): void {
    this.capturedImage = null;
    this.faceStep      = 'camera';
    this.faceError     = '';
    setTimeout(() => this.startCamera(), 200);
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  closeFaceModal(): void {
    this.stopCamera();
    this.showFaceModal = false;
    this.capturedImage = null;
    this.faceStep      = 'camera';
    this.faceError     = '';
    this.faceLoading   = false;
  }

  // ─── Submit face + email ──────────────────────────────────
  submitFaceLogin(): void {
    if (this.faceEmailForm.invalid || !this.capturedImage) return;

    this.faceLoading = true;
    this.faceError   = '';

    const payload = {
      email:       this.faceEmailForm.value.email,
      imageBase64: this.capturedImage
    };

    this.authService.faceLogin(payload).subscribe({
      next: () => {
        this.faceLoading = false;
        this.closeFaceModal();
        this.appToast.showSuccess('Face login successful!');
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.faceLoading = false;
        if (err.status === 401) {
          this.faceError = 'Face does not match. Please try again.';
        } else if (err.status === 404) {
          this.faceError = 'No account found with this email.';
        } else if (err.status === 403) {
          this.faceError = 'Account is disabled or locked.';
        } else if (err.status === 422) {
          this.faceError = 'No profile photo on file. Face login unavailable.';
        } else if (err.status === 503) {
          this.faceError = 'Face recognition service unavailable. Try again later.';
        } else {
          this.faceError = 'Something went wrong. Please try again.';
        }
      }
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────
  private redirectAfterLogin(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.loading = false;
        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
          return;
        }
        if (!user.profileCompleted) {
          this.router.navigate(['/user/complete-profile']);
          return;
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.appToast.showError('Your account is under review');
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return;
        }
        this.appToast.showError('Failed to load user data');
      }
    });
  }

  loginWithGoogle(): void {
    if (!this.captchaPassed) {
      this.appToast.showError('Please complete the CAPTCHA verification first');
      return;
    }
    localStorage.setItem('auth_flow', 'login');
    this.authService.getGoogleUrl('login').subscribe(res => {
      window.location.href = res.url;
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  goToSignup():     void { this.router.navigate(['/auth/signup']); }
}