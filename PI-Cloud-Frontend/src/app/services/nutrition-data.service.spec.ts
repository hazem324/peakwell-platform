import { TestBed } from '@angular/core/testing';

import { NutritionDataService } from './nutrition-data.service';

describe('NutritionDataService', () => {
  let service: NutritionDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NutritionDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
