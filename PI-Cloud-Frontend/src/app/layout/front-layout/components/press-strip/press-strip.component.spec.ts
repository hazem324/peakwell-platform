import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PressStripComponent } from './press-strip.component';

describe('PressStripComponent', () => {
  let component: PressStripComponent;
  let fixture: ComponentFixture<PressStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PressStripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PressStripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
