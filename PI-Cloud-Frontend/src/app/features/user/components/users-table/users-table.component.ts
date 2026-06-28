import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AdminUser } from '../../../../models/admin-user.model';
import { initials, statusColor, roleBg, roleColor, avatarBg, formatAddress } from '../../../../helper/admin-user.helpers';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss'
})
export class UsersTableComponent {

  @Input()  users: AdminUser[] = [];
  @Input()  searchQuery = '';
  @Output() detailClick = new EventEmitter<AdminUser>();
  @Output() statusClick = new EventEmitter<AdminUser>();

  initials      = initials;
  statusColor   = statusColor;
  roleBg        = roleBg;
  roleColor     = roleColor;
  avatarBg      = avatarBg;
  formatAddress = formatAddress;
}