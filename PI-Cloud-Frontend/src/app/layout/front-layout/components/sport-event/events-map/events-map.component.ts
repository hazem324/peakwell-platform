import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { SportEvent } from '../../../../../models/sport-event.model';
import { SportEventService } from '../../../../../services/sport-event.service';

@Component({
  selector: 'app-events-map',
  templateUrl: './events-map.component.html',
  styleUrls: ['./events-map.component.scss']
})
export class EventsMapComponent implements AfterViewInit {

  map!: L.Map;
  events: SportEvent[] = [];
  loading = false;
  errorMessage = '';

  constructor(private sportEventService: SportEventService) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadEvents();
  }

  initMap(): void {
    this.map = L.map('events-map').setView([36.8065, 10.1815], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.sportEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = (data || []).filter(
          event => event.latitude != null && event.longitude != null
        );

        this.addMarkersToMap();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des événements.';
        this.loading = false;
      }
    });
  }

  getMarkerIcon(category: string): L.Icon {
    let color = 'blue';

    switch (category) {
      case 'SPORT':
        color = 'blue';
        break;
      case 'CINEMA':
        color = 'violet';
        break;
      case 'KARAOKE':
        color = 'red';
        break;
      case 'CEREMONY':
        color = 'yellow';
        break;
      default:
        color = 'grey';
    }

    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  addMarkersToMap(): void {
    if (!this.map || this.events.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    this.events.forEach(event => {
      if (event.latitude == null || event.longitude == null) return;

      const icon = this.getMarkerIcon(event.category);

      const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(this.map);

      marker.bindPopup(`
        <div style="min-width: 220px;">
          <h4 style="margin: 0 0 8px 0;">${event.title}</h4>
          <p style="margin: 4px 0;"><strong>Category:</strong> ${event.category}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${event.status}</p>
        </div>
      `);

      bounds.push([event.latitude, event.longitude]);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}