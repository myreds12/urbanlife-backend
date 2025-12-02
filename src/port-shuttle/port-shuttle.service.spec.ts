import { Test, TestingModule } from '@nestjs/testing';
import { PortShuttleService } from './port-shuttle.service';

describe('PortShuttleService', () => {
  let service: PortShuttleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortShuttleService],
    }).compile();

    service = module.get<PortShuttleService>(PortShuttleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
