import { Test, TestingModule } from '@nestjs/testing';
import { NotifikasiWaService } from './notifikasi-wa.service';

describe('NotifikasiWaService', () => {
  let service: NotifikasiWaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotifikasiWaService],
    }).compile();

    service = module.get<NotifikasiWaService>(NotifikasiWaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
