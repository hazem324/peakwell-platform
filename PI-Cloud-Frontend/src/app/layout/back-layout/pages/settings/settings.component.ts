import { Component } from '@angular/core';
import { ToastServiceService } from '../../../../services/toast-service.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

  activeTab = 'practice';
  tabs = ['practice', 'profile', 'billing', 'integrations'];

  practiceName = 'Nourish & Bloom Practice';
  practiceEmail = 'hello@nourishandbloom.com';
  practicePhone = '+1 (555) 234-5678';
  units = 'metric';
  timezone = 'EST';

  dietitianName = 'Dr. Sarah Mills';
  credentials = 'RD, CDN, MS';
  bio = 'Registered Dietitian with 10+ years experience in clinical nutrition and weight management.';

  autoConfirm = true;
  hipaaConsent = true;
  notifyOnSubmit = false;

  integrations = [
    { name: 'MyFitnessPal',    icon: '🍎', connected: true  },
    { name: 'Google Fit',      icon: '❤️', connected: true  },
    { name: 'Google Calendar', icon: '📅', connected: true  },
    { name: 'Stripe',          icon: '💳', connected: false },
    { name: 'Mailchimp',       icon: '📧', connected: false },
    { name: 'Cronometer',      icon: '🥗', connected: false },
  ];

  constructor(public toastService: ToastServiceService) {}

  saveSettings(): void {
    this.toastService.show('✅ Settings saved successfully!');
  }

  toggleIntegration(integration: any): void {
    integration.connected = !integration.connected;
    const msg = integration.connected ? `✅ Connected: ${integration.name}` : `🔌 Disconnected: ${integration.name}`;
    this.toastService.show(msg);
  }

}
