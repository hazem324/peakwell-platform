import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanEtudiantComponent } from './plan-etudiant.component';

describe('PlanEtudiantComponent', () => {
  let component: PlanEtudiantComponent;
  let fixture: ComponentFixture<PlanEtudiantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanEtudiantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanEtudiantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});