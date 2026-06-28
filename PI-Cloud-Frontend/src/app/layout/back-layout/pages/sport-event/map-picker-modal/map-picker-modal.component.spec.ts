import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPickerModalComponent } from './map-picker-modal.component';

describe('MapPickerModalComponent', () => {
  let component: MapPickerModalComponent;
  let fixture: ComponentFixture<MapPickerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapPickerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
