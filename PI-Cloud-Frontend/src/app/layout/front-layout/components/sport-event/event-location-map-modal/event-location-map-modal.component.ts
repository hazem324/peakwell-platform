import { AfterViewInit, Component, Input, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'marker-icon-2x.png',
  iconUrl: 'marker-icon.png',
  shadowUrl: 'marker-shadow.png'
});
@Component({
  selector: 'app-event-location-map-modal',
  templateUrl: './event-location-map-modal.component.html',
  styleUrls: ['./event-location-map-modal.component.scss']
})
export class EventLocationMapModalComponent implements AfterViewInit {

  @Input() latitude!: number;
  @Input() longitude!: number;
  @Input() address: string = '';

  @Output() close = new EventEmitter<void>();

  map!: L.Map;
  marker!: L.Marker;

  ngAfterViewInit(): void {
    this.map = L.map('event-location-map').setView([this.latitude, this.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);

    if (this.address) {
      this.marker.bindPopup(this.address).openPopup();
    }

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  onClose(): void {
    this.close.emit();
  }
}