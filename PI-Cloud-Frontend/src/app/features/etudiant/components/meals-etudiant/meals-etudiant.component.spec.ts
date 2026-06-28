import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealsEtudiantComponent } from './meals-etudiant.component';

describe('MealsEtudiantComponent', () => {
  let component: MealsEtudiantComponent;
  let fixture: ComponentFixture<MealsEtudiantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MealsEtudiantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealsEtudiantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});