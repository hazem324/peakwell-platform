import { Injectable } from '@angular/core';

export interface Client {
  id: number;
  name: string;
  goal: string;
  calories: number;
  adherence: number;
  lastSeen: string;
  status: 'active' | 'inactive' | 'waitlist';
  avatarColor: string;
  initials: string;
  duration: string;
  nextAppointment: string;
}

export interface Appointment {
  id: number;
  client: string;
  type: string;
  time: string;
  day: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

export interface KpiCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
}

export interface Alert {
  type: 'warning' | 'info';
  message: string;
  client: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {

   readonly kpiCards: KpiCard[] = [
    { label: 'Active Clients',        value: '48',   change: '+3 this month',  positive: true,  icon: '👥', color: 'terra'  },
    { label: 'Sessions This Month',   value: '124',  change: '+18% vs prior',  positive: true,  icon: '📅', color: 'sage'   },
    { label: 'Meal Plans Active',     value: '31',   change: '6 expiring soon',positive: false, icon: '📋', color: 'warm'   },
    { label: 'Goal Completion',       value: '73%',  change: '+5% vs last mo', positive: true,  icon: '🎯', color: 'terra'  },
  ];

  readonly alerts: Alert[] = [
    { type: 'warning', client: 'James Fowler',  message: 'Meal plan adherence below 60% for 2 weeks' },
    { type: 'info',    client: 'Emma Clarke',   message: 'Meal plan expires in 3 days — renewal needed' },
  ];

  readonly clients: Client[] = [
    { id: 1, name: 'Maya Johnson',   goal: 'Weight Loss',    calories: 1600, adherence: 88, lastSeen: '2 days ago',  status: 'active',   avatarColor: '#fde8d8', initials: 'MJ', duration: '6 months',  nextAppointment: 'Mar 7' },
    { id: 2, name: 'Carlos Mena',    goal: 'Muscle Gain',    calories: 2800, adherence: 95, lastSeen: 'Today',       status: 'active',   avatarColor: '#e8f0dd', initials: 'CM', duration: '3 months',  nextAppointment: 'Mar 8' },
    { id: 3, name: 'James Fowler',   goal: 'Weight Loss',    calories: 1500, adherence: 54, lastSeen: '1 week ago',  status: 'active',   avatarColor: '#fff3e0', initials: 'JF', duration: '2 months',  nextAppointment: 'Mar 6' },
    { id: 4, name: 'Priya Sharma',   goal: 'Heart Health',   calories: 1800, adherence: 91, lastSeen: 'Yesterday',   status: 'active',   avatarColor: '#fce4ec', initials: 'PS', duration: '8 months',  nextAppointment: 'Mar 9' },
    { id: 5, name: 'Emma Clarke',    goal: 'Sports Nutrition',calories: 2400, adherence: 79, lastSeen: '3 days ago',  status: 'active',   avatarColor: '#e8eaf6', initials: 'EC', duration: '4 months',  nextAppointment: 'Mar 7' },
    { id: 6, name: 'Liam Torres',    goal: 'Diabetes Mgmt',  calories: 1700, adherence: 83, lastSeen: 'Today',       status: 'waitlist', avatarColor: '#f9fbe7', initials: 'LT', duration: 'New',       nextAppointment: 'TBD'   },
  ];

  readonly appointments: Appointment[] = [
    { id: 1,  client: 'Maya Johnson',  type: 'Follow-up',       time: '9:00',  day: 'Mon', color: 'green'  },
    { id: 2,  client: 'Carlos Mena',   type: 'Check-in',        time: '10:00', day: 'Mon', color: 'blue'   },
    { id: 3,  client: 'James Fowler',  type: 'Urgent Review',   time: '11:00', day: 'Mon', color: 'orange' },
    { id: 4,  client: 'Priya Sharma',  type: 'Initial Consult', time: '9:00',  day: 'Tue', color: 'purple' },
    { id: 5,  client: 'Emma Clarke',   type: 'Follow-up',       time: '10:00', day: 'Tue', color: 'green'  },
    { id: 6,  client: 'Maya Johnson',  type: 'Group Session',   time: '13:00', day: 'Wed', color: 'blue'   },
    { id: 7,  client: 'Carlos Mena',   type: 'Plan Review',     time: '11:00', day: 'Wed', color: 'orange' },
    { id: 8,  client: 'Priya Sharma',  type: 'Follow-up',       time: '9:00',  day: 'Thu', color: 'green'  },
    { id: 9,  client: 'Liam Torres',   type: 'New Intake',      time: '10:00', day: 'Thu', color: 'purple' },
    { id: 10, client: 'Emma Clarke',   type: 'Check-in',        time: '15:00', day: 'Fri', color: 'blue'   },
  ];

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  readonly timeSlots = ['9:00', '10:00', '11:00', '13:00', '15:00'];

  getAppointmentsForSlot(day: string, time: string): Appointment[] {
    return this.appointments.filter(a => a.day === day && a.time === time);
  }
}