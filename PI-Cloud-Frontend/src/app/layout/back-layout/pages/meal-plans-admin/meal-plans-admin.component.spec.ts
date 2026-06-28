import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealPlansAdminComponent } from './meal-plans-admin.component';

describe('MealPlansAdminComponent', () => {
  let component: MealPlansAdminComponent;
  let fixture: ComponentFixture<MealPlansAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MealPlansAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealPlansAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
