import { Test, TestingModule } from '@nestjs/testing';
import { KotaService } from './kota.service';

describe('KotaService', () => {
  let service: KotaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KotaService],
    }).compile();

    service = module.get<KotaService>(KotaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
