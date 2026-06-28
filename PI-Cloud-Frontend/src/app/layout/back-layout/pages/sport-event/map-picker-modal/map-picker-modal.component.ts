import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';

import { LocationMapService } from '../../../../../services/location-map.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'marker-icon-2x.png',
  iconUrl: 'marker-icon.png',
  shadowUrl: 'marker-shadow.png'
});
@Component({
  selector: 'app-map-picker-modal',
  templateUrl: './map-picker-modal.component.html',
  styleUrls: ['./map-picker-modal.component.scss']
})
export class MapPickerModalComponent implements AfterViewInit {

  @Input() latitude?: number;
  @Input() longitude?: number;

  @Output() locationSelected = new EventEmitter<{
    address: string;
    latitude: number;
    longitude: number;
  }>();

  @Output() close = new EventEmitter<void>();

  map!: L.Map;
  marker!: L.Marker;

  constructor(private locationMapService: LocationMapService) {}

  ngAfterViewInit(): void {
    const lat = this.latitude ?? 36.8065;
    const lng = this.longitude ?? 10.1815;

    this.map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.latitude != null && this.longitude != null) {
      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([clickedLat, clickedLng]).addTo(this.map);

      this.locationMapService.reverseGeocode(clickedLat, clickedLng).subscribe({
        next: (res) => {
          const address = res?.display_name || `${clickedLat}, ${clickedLng}`;

          this.locationSelected.emit({
            address,
            latitude: clickedLat,
            longitude: clickedLng
          });
        },
        error: (err) => {
          console.error('Erreur reverse geocoding :', err);

          this.locationSelected.emit({
            address: `${clickedLat}, ${clickedLng}`,
            latitude: clickedLat,
            longitude: clickedLng
          });
        }
      });
    });

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  onClose(): void {
    this.close.emit();
  }
}