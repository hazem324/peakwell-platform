import { TestBed } from '@angular/core/testing';

import { AiPredictionService } from './ai-prediction.service';

describe('AiPredictionService', () => {
  let service: AiPredictionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiPredictionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
