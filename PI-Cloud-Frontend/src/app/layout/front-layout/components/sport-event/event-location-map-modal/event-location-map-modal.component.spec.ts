import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLocationMapModalComponent } from './event-location-map-modal.component';

describe('EventLocationMapModalComponent', () => {
  let component: EventLocationMapModalComponent;
  let fixture: ComponentFixture<EventLocationMapModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventLocationMapModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventLocationMapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
