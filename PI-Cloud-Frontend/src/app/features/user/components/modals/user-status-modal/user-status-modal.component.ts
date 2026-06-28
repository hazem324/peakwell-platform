import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { AdminUser } from '../../../../../models/admin-user.model';
import { initials, roleBg, roleColor, avatarBg } from '../../../../../helper/admin-user.helpers';
import { AiService } from '../../../../../services/ai.service';
import { UserService } from '../../../../../services/user.service';
import { AppToastService } from '../../../../../services/app-toast.service';

export interface StatusChangeEvent {
  user:           AdminUser;
  newStatus:      'ACTIVE' | 'BANNED';
  banReason:      string;
  description:    string;
}

@Component({
  selector: 'app-user-status-modal',
  templateUrl: './user-status-modal.component.html',
  styleUrl: './user-status-modal.component.scss'
})
export class UserStatusModalComponent implements OnChanges {

  @Input()  user:    AdminUser | null = null;
  @Input()  visible = false;
  @Output() close   = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<StatusChangeEvent>();

  constructor(
    private aiService:  AiService,
    private userService: UserService,
    private apptoast:   AppToastService
  ) {}

  statusAction:  'ACTIVE' | 'BANNED' = 'BANNED';
  banReason      = '';
  description    = '';
  isGenerating   = false;
  loading        = false;

  initials  = initials;
  roleBg    = roleBg;
  roleColor = roleColor;
  avatarBg  = avatarBg;

  ngOnChanges(): void {
    if (this.user) {
      this.statusAction = this.user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      this.banReason    = this.user.banReason      || '';
      this.description  = this.user.banDescription || '';
    }
  }

  onReasonChange(): void {
    if (!this.banReason) return;

    this.isGenerating = true;

    const action = this.statusAction === 'BANNED' ? 'ban' : 'reactivate';

    this.aiService.generateBanDescription(`${action}: ${this.banReason}`)
      .subscribe({
        next: (res) => {
          this.description  = res;
          this.isGenerating = false;
        },
        error: () => {
          this.description  = this.getFallback(this.banReason);
          this.isGenerating = false;
        }
      });
  }

  private getFallback(reason: string): string {
    switch (reason) {

      // ── Ban reasons ───────────────────────────────────────────────────────
      case 'Spam and unsolicited promotions':
        return 'Dear user,\n\nYour account has been suspended due to repeated spam and unsolicited promotional activity that violates our platform policies.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'Fraudulent activity or scam attempts':
        return 'Dear user,\n\nYour account has been suspended due to detected fraudulent activity or suspected scam behavior on the platform.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'Impersonation of another person or entity':
        return 'Dear user,\n\nYour account has been suspended due to impersonation of another person or entity, which violates our platform policies.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'Hate speech or offensive content':
        return 'Dear user,\n\nYour account has been suspended due to posting content that violates our community standards regarding respectful communication.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'False information':
        return 'Dear user,\n\nYour account has been suspended due to providing false or misleading information on the platform.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'Terms violation':
        return 'Dear user,\n\nYour account has been suspended due to a violation of our terms of service.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      case 'Other':
        return 'Dear user,\n\nYour account has been suspended due to a violation of our platform policies.\n\nIf you believe this action was taken in error, please contact our support team.\n\nBest regards,\nPeakWell Team';

      // ── Unban subjects ────────────────────────────────────────────────────
      case 'Account Reactivated':
        return 'Dear user,\n\nYour account has been reactivated. You may now access the platform normally.\n\nWe appreciate your patience during this process.\n\nBest regards,\nPeakWell Team';

      case 'Access Restored':
        return 'Dear user,\n\nYour access to the platform has been fully restored. You can now log in and resume your activity.\n\nBest regards,\nPeakWell Team';

      case 'Account Reinstated':
        return 'Dear user,\n\nYour account has been reinstated following a review. You are welcome back to the platform.\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nPeakWell Team';

      default:
        return '';
    }
  }

  onConfirm(): void {
    if (!this.user) return;

    const subject =
      this.statusAction === 'BANNED'
        ? `Account Suspension - ${this.banReason}`
        : `${this.banReason}`;

    const message = this.description;

    this.loading = true;

    console.log('STATUS:', this.statusAction);
    console.log('USER ID:', this.user.id);
   console.log('SUBJECT:', subject);
   console.log('MESSAGE:', message);

    this.userService.toggleUserStatus(this.user.id, subject, message).subscribe({
      next: () => {
        const successMsg =
          this.statusAction === 'BANNED'
            ? 'User has been banned successfully.'
            : 'User has been reactivated successfully.';

        this.apptoast.showSuccess(successMsg);

        this.confirm.emit({
          user:        this.user!,
          newStatus:   this.statusAction,
          banReason:   this.banReason,
          description: this.description,
        });

        this.close.emit();
      },

      error: (err) => {
        this.loading = false;

        let errorMsg = 'Something went wrong. Please try again.';

        if (err.status === 404) {
          errorMsg = 'User not found.';
        } else if (err.status === 500) {
          errorMsg = err.error?.message || 'Server error occurred.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        this.apptoast.showError(errorMsg);
        console.error('FULL ERROR:', err);
      console.error('ERROR BODY:', err.error);
      console.error('STATUS:', err.status); 
      },

      complete: () => {
        this.loading = false;
      }
    });
  }

  get isValid(): boolean {
    return !!this.banReason;
  }
}