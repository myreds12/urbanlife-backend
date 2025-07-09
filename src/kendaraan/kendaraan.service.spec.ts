import { Test, TestingModule } from '@nestjs/testing';
import { KendaraanService } from './kendaraan.service';

describe('KendaraanService', () => {
  let service: KendaraanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KendaraanService],
    }).compile();

    service = module.get<KendaraanService>(KendaraanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
