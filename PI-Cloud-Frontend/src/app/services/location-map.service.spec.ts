import { TestBed } from '@angular/core/testing';

import { LocationMapService } from './location-map.service';

describe('LocationMapService', () => {
  let service: LocationMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
