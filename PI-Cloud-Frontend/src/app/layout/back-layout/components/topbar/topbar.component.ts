import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  pageTitle = 'Dashboard';
  showNewClient = false;
  newClientName = '';
  newClientGoal = 'Weight Loss';
  currentDate = '';
  greeting = '';

  quickStats: { icon: string; label: string; value: string }[] = [];

  goals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'Sports Nutrition'];

  titleMap: Record<string, string> = {
    '/admin/dashboard':  'Dashboard',
    '/admin/consultations':   'Consultations',
    '/admin/clients':    'Clients',
    '/admin/meal-plans': 'Meal Plans',
    '/admin/schedule':   'Schedule',
    '/admin/reports':    'Reports',
    '/admin/settings':   'Settings',
    '/admin/produits':   'Produits',

  };

  statsMap: Record<string, { icon: string; label: string; value: string }[]> = {
    '/admin/dashboard':  [
      { icon: '👥', label: 'Active Clients', value: '48'  },
      { icon: '📅', label: 'Sessions Today', value: '3'   },
      { icon: '⚠️', label: 'Alerts',         value: '2'   },
    ],
    '/admin/consultations': [
      { icon: '🗓', label: 'All Sessions',   value: '—'  },
      { icon: '✅', label: 'Upcoming',       value: '—'  },
      { icon: '❌', label: 'Rejected',       value: '—'  },
    ],
    '/admin/meal-plans': [
      { icon: '📋', label: 'Active Plans',   value: '31'  },
      { icon: '⚠️', label: 'Expiring Soon',  value: '6'   },
      { icon: '✅', label: 'On Track',       value: '25'  },
    ],
    '/admin/schedule':   [
      { icon: '📅', label: 'This Week',      value: '10'  },
      { icon: '✅', label: 'Confirmed',      value: '8'   },
      { icon: '⏳', label: 'Pending',        value: '2'   },
    ],
    '/admin/reports':    [
      { icon: '📈', label: 'Avg Adherence',  value: '73%' },
      { icon: '⚖️', label: 'Avg Loss/mo',    value: '1.8kg'},
      { icon: '💰', label: 'Revenue',        value: '$9.2k'},
    ],
    '/admin/settings':   [],
  };

  get userName(): string { return this.authService.displayTitle; }

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.setDate();
    this.setGreeting();
    this.updatePage(this.router.url);

    this.authService.fetchCurrentUser().subscribe(); // load real user in background

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.updatePage(e.url);
    });
  }

updatePage(url: string): void {
  if (url.startsWith('/admin/dossier/')) {
    this.pageTitle  = 'Medical Record';
    this.quickStats = [
      { icon: '📊', label: 'Module',    value: 'Dossier'  },
      { icon: '🔒', label: 'Access',    value: 'Secure'   },
      { icon: '⚕️', label: 'Standard',  value: 'HIPAA'    },
    ];
    return;
  }
  this.pageTitle  = this.titleMap[url]  ?? 'Dashboard';
  this.quickStats = this.statsMap[url]  ?? [];
}

  setDate(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12)      this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else                this.greeting = 'Good evening';
  }

  openNewClient(): void  { this.showNewClient = true; }
  closeNewClient(): void { this.showNewClient = false; }

  saveClient(): void {
    if (!this.newClientName.trim()) return;
    this.closeNewClient();
    this.newClientName = '';
  }
  
}
