import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-users-toolbar',
  templateUrl: './users-toolbar.component.html',
  styleUrl: './users-toolbar.component.scss'
})
export class UsersToolbarComponent {

  @Input()  totalCount   = 0;
  @Input()  activeStatus = 'ALL';
  @Input() activeRole = 'ALL';
  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() roleChange = new EventEmitter<string>();

  statusFilters = ['ALL', 'ACTIVE', 'PENDING', 'BANNED'];
  roleFilters   = ['ALL', 'STUDENT', 'DIETITIAN', 'RESTAURANT'];
  searchQuery   = '';

  onSearch(): void           { this.searchChange.emit(this.searchQuery); }
  clearSearch(): void        { this.searchQuery = ''; this.searchChange.emit(''); }
  setStatus(s: string): void { this.statusChange.emit(s); }
  setRole(r: string): void   { this.roleChange.emit(r); }
}