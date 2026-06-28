import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  features = [
    {
      icon: '📊',
      title: 'Health Monitoring',
      desc: 'Log biometrics — weight, BMI, blood pressure, glucose — and track trends over time with automatic health alerts and AI-powered insights.',
    },
    {
      icon: '🎯',
      title: 'Personalised Goals',
      desc: 'Set health goals with automatic milestone detection. Goals can be self-created or assigned directly by your nutritionist with progress tracking.',
    },
    {
      icon: '🩺',
      title: 'Nutritionist Consultations',
      desc: 'Book video or in-person consultations with registered dietitians. Manage schedules, receive notes, and track follow-up care in one place.',
    },
    {
      icon: '🗺️',
      title: 'Patient Health Map',
      desc: 'Nutritionists get a real-time heatmap of their panel — health scores, engagement levels, churn risk, and critical alerts in a single dashboard.',
    },
    {
      icon: '📰',
      title: 'Articles & Recipes',
      desc: 'A curated library of science-backed nutrition articles and tested recipes designed to support every health goal and dietary preference.',
    },
    {
      icon: '🧮',
      title: 'Nutrition Calculator',
      desc: 'Instantly compute BMI, daily calorie needs, and macronutrient targets based on your personal data, activity level, and health objective.',
    },
    {
      icon: '🏅',
      title: 'Sport Events',
      desc: 'Discover and register for local wellness and fitness events. View event locations on an interactive map and manage your registrations.',
    },
    {
      icon: '🍽️',
      title: 'Restaurant Space',
      desc: 'Partner restaurants can showcase healthy menu options, reaching health-conscious members actively working toward their nutrition goals.',
    },
  ];

  audiences = [
    {
      icon: '🎓',
      role: 'Students & Members',
      color: '#5a8060',
      bg: 'rgba(90,128,96,0.08)',
      border: 'rgba(90,128,96,0.2)',
      points: [
        'Full medical dossier & biometric history',
        'AI health insights & diagnosis support',
        'Goal tracking with milestone rewards',
        'Book & manage consultations',
        'Access articles, recipes & events',
      ],
    },
    {
      icon: '👨‍⚕️',
      role: 'Nutritionists',
      color: '#c96a3f',
      bg: 'rgba(201,105,63,0.08)',
      border: 'rgba(201,105,63,0.2)',
      points: [
        'Client panel with health heatmap',
        'Assign personalised goals & plans',
        'Manage consultation schedule',
        'Real-time critical health alerts',
        'Patient biometric history & dossier',
      ],
    },
    {
      icon: '🍴',
      role: 'Restaurants',
      color: '#3a80b0',
      bg: 'rgba(58,128,176,0.08)',
      border: 'rgba(58,128,176,0.2)',
      points: [
        'Dedicated restaurant showcase space',
        'Reach health-focused members',
        'Promote healthy menu options',
        'Participate in wellness events',
        'Build a community presence',
      ],
    },
  ];

  stats = [
    { value: '500+', label: 'Tested Recipes' },
    { value: '3',    label: 'User Roles Supported' },
    { value: '100%', label: 'Science-Backed Content' },
    { value: '24/7', label: 'Health Monitoring' },
  ];
}
