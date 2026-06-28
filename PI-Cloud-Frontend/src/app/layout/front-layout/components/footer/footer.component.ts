import { Component } from '@angular/core';
import { ToastServiceService } from '../../../../services/toast-service.service';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  currentYear = new Date().getFullYear();

  socials = [
    { icon: '📸', msg: '📸 Opening Instagram…'  },
    { icon: '▶️', msg: '▶️ Opening YouTube…'    },
    { icon: '📌', msg: '📌 Opening Pinterest…'  },
    { icon: '🐦', msg: '🐦 Opening Twitter…'    },
  ];

  columns: { heading: string; links: { label: string; anchor?: string; route?: string }[] }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'Health Monitoring', route: '/dossier' },
        { label: 'Nutrition Calculator', anchor: 'calculator' },
        { label: 'Recipes & Articles', anchor: 'recipes' },
        { label: 'Sport Events', route: '/events' },
        { label: 'About PeakWell', anchor: 'about' },
      ],
    },
    {
      heading: 'For Nutritionists',
      links: [
        { label: 'Nutritionist Space', route: '/nutritionist' },
        { label: 'Patient Heatmap', route: '/nutritionist/heatmap' },
        { label: 'Client Management', route: '/nutritionist/clients' },
        { label: 'Consultation Schedule', route: '/nutritionist/schedule' },
        { label: 'Assign Goals & Plans', route: '/nutritionist' },
      ],
    },
    {
      heading: 'Your Account',
      links: [
        { label: 'Sign In', route: '/auth/login' },
        { label: 'My Profile', route: '/profile' },
        { label: 'My Registrations', route: '/my-registrations' },
        { label: 'Restaurant Space', route: '/restaurant' },
        { label: 'Student Space', route: '/etudiant' },
      ],
    },
  ];

  stats = [
    { value: '500+', label: 'Tested Recipes' },
    { value: '3',    label: 'User Roles' },
    { value: '100%', label: 'Science-Backed' },
    { value: '24/7', label: 'Health Monitoring' },
  ];

  constructor(public toastService: ToastServiceService) {}

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
