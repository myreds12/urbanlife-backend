import { Test, TestingModule } from '@nestjs/testing';
import { AirportShuttleService } from './airport-shuttle.service';

describe('AirportShuttleService', () => {
  let service: AirportShuttleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirportShuttleService],
    }).compile();

    service = module.get<AirportShuttleService>(AirportShuttleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
