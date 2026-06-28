import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {

  metrics = [
    { label: 'Weight',    value: '74 kg',  trend: '1.2 kg', up: false, color: '#c96a3f' },
    { label: 'BMI',       value: '22.4',   trend: '0.3',    up: false, color: '#4a7a4e' },
    { label: 'Glucose',   value: '94',     trend: '2 mg',   up: false, color: '#2a7fa8' },
    { label: 'Pressure',  value: '118/76', trend: 'stable', up: true,  color: '#7a9e7e' },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

}
