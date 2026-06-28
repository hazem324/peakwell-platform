export type EventCategory = 'SPORT' | 'CINEMA' | 'KARAOKE' | 'CEREMONY' | 'OTHER';

export interface SportEvent {
  id?: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  category: EventCategory;
  eventDetail: string;
  maxParticipants: number;
  currentParticipants?: number;
  imageUrl?: string;
  status?: 'OPEN' | 'FULL' | 'CANCELLED' | 'FINISHED';
}