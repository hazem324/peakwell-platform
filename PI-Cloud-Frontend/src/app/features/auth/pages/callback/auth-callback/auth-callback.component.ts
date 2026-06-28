import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../../services/auth.service';
import { AppToastService } from '../../../../../services/app-toast.service';
import { UserService } from '../../../../../services/user.service';


@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss'
})
export class AuthCallbackComponent implements OnInit {
  loading = true;
  showRoleModal = false;
  pendingAccessToken: string | null = null;
  selectedRole = 'STUDENT';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService:UserService,
    private toast: AppToastService
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const flow = (localStorage.getItem('auth_flow') || 'signup') as 'login' | 'signup';

    if (!code) {
      this.toast.showError('Missing authorization code');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.authService.handleGoogleAuth(code, flow).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.message === 'ROLE_SELECTION_REQUIRED') {
          this.pendingAccessToken = res.accessToken;
          this.showRoleModal = true;
          return;
        }

        if (res.accessToken) {

  console.log('GOOGLE LOGIN SUCCESS');

  //  Save token
  this.authService.saveToken(res.accessToken);
  localStorage.removeItem('auth_flow');

  this.toast.showSuccess('Login successful');

  //  SAME LOGIC AS MANUAL LOGIN
  this.userService.getMe().subscribe({

    next: (user) => {
      console.log('USER FROM API:', user);

      this.loading = false;

      //  ADMIN
      if (user.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
        return;
      }

      //  PROFILE NOT COMPLETED
      if (!user.profileCompleted) {
        this.router.navigate(['/user/complete-profile']);
        return;
      }

      //  NORMAL USER
      this.router.navigate(['/']);
    },

    error: (err) => {
      console.error('ERROR fetching user:', err);
      this.loading = false;

      if (err.status === 403) {
        this.toast.showError('Your account is under review');
        localStorage.removeItem('token');
        this.router.navigate(['/auth/login']);
        return;
      }

      this.toast.showError('Failed to load user data');
    }

  });

  return;
}

        this.toast.showError('Unexpected authentication response');
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 409) {
          this.toast.showError('Email already exists');
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 404) {
          this.toast.showError('Account not found, please sign up');
          this.router.navigate(['/auth/signup']);
          return;
        }

        this.toast.showError('Google authentication failed');
        this.router.navigate(['/auth/login']);
      }
    });
  }

  confirmRole(): void {
  if (!this.pendingAccessToken) {
    console.error(" No access token found");
    return;
  }

  console.log(" SENDING GOOGLE SIGNUP:");
  console.log("ROLE:", this.selectedRole);

  this.authService.completeGoogleSignup(this.pendingAccessToken, this.selectedRole)
    .subscribe({

      next: () => {

        //  Clean UI + storage
        this.showRoleModal = false;
        localStorage.removeItem('auth_flow');
        localStorage.removeItem('pendingGoogleAccessToken');

        this.toast.showSuccess('Account created successfully');

        //  IMPORTANT: DO NOT save old token
        //  Force new login to get updated token

        this.router.navigate(['/auth/login']);
      },

      error: (err) => {
        console.error(" SIGNUP ERROR:", err);

        if (err.status === 409) {
          this.toast.showError('Email already exists');
          return;
        }

        this.toast.showError(err.error?.message || 'Could not complete signup');
      }
    });
}

  closeModal(): void {
    this.showRoleModal = false;
    this.router.navigate(['/auth/signup']);
  }
}