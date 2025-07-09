import { Test, TestingModule } from '@nestjs/testing';
import { AdminWaService } from './admin-wa.service';

describe('AdminWaService', () => {
  let service: AdminWaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminWaService],
    }).compile();

    service = module.get<AdminWaService>(AdminWaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
