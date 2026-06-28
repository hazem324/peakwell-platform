import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AdminUser } from '../../../../../models/admin-user.model';
import { initials, statusColor, roleBg, roleColor, avatarBg, formatAddress } from '../../../../../helper/admin-user.helpers';


@Component({
  selector: 'app-user-detail-modal',
  templateUrl: './user-detail-modal.component.html',
  styleUrl: './user-detail-modal.component.scss'
})
export class UserDetailModalComponent {

  @Input()  user:    AdminUser | null = null;
  @Input()  visible = false;
  @Output() close       = new EventEmitter<void>();
  @Output() openStatus  = new EventEmitter<AdminUser>();

  initials      = initials;
  statusColor   = statusColor;
  roleBg        = roleBg;
  roleColor     = roleColor;
  avatarBg      = avatarBg;
  formatAddress = formatAddress;

  onStatusClick(): void {
    if (this.user) {
      this.close.emit();
      this.openStatus.emit(this.user);
    }
  }
}