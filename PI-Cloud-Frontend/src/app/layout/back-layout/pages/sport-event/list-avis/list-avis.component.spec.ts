import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAvisComponent } from './list-avis.component';

describe('ListAvisComponent', () => {
  let component: ListAvisComponent;
  let fixture: ComponentFixture<ListAvisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListAvisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAvisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
