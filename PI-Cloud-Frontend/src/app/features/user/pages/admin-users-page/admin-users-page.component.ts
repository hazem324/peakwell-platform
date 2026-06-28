import { Component, OnInit } from '@angular/core';
import { AdminUser } from '../../../../models/admin-user.model';
import { StatusChangeEvent } from '../../components/modals/user-status-modal/user-status-modal.component';
import { UserService } from '../../../../services/user.service';
import { deriveStatus } from '../../../../helper/admin-user.helpers';

@Component({
  selector: 'app-admin-users-page',
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss'
})
export class AdminUsersPageComponent implements OnInit {

  allUsers:      AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  loading = true;

  activeStatus = 'ALL';
  searchQuery  = '';
  activeRole   = 'ALL'; 

  detailUser: AdminUser | null = null;
  showDetail  = false;

  statusUser: AdminUser | null = null;
  showStatus  = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users.map(u => ({
          ...u,
          status: deriveStatus(u)
        }));
        this.filteredUsers = [...this.allUsers];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading = false;
      }
    });
  }

  onRoleFilter(role: string): void {
  this.activeRole = role;
  this.applyFilters();
}


  onSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onStatusFilter(status: string): void {
    this.activeStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u => {
      const addr = u.address
        ? `${u.address.street} ${u.address.city} ${u.address.country}`.toLowerCase()
        : '';

      const matchSearch =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)  ||
        u.email.toLowerCase().includes(q)     ||
        (u.phoneNumber || '').toLowerCase().includes(q) ||
        addr.includes(q);

      const matchStatus = this.activeStatus === 'ALL' || u.status === this.activeStatus;

        const matchRole = this.activeRole === 'ALL' || u.role === this.activeRole;
      return matchSearch && matchStatus && matchRole;;
    });
  }

  openDetail(user: AdminUser): void {
    this.detailUser = user;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.detailUser = null;
  }

  openStatus(user: AdminUser): void {
    this.statusUser = user;
    this.showStatus = true;
  }

  closeStatus(): void {
    this.showStatus = false;
    this.statusUser = null;
  }

  onStatusConfirm(event: StatusChangeEvent): void {
    const target = this.allUsers.find(u => u.id === event.user.id);
    if (target) {
      target.status  = event.newStatus;
      target.enabled = event.newStatus !== 'BANNED';
      if (event.newStatus === 'BANNED') {
        target.banReason      = event.banReason;
        target.banDescription = event.description;
      } else {
        target.banReason      = undefined;
        target.banDescription = undefined;
      }
    }

    // TODO: this.userService.updateUserStatus(event.user.id, event).subscribe()

    this.applyFilters();
    this.closeStatus();
  }
}