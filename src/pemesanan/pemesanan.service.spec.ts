import { Test, TestingModule } from '@nestjs/testing';
import { PemesananService } from './pemesanan.service';

describe('PemesananService', () => {
  let service: PemesananService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PemesananService],
    }).compile();

    service = module.get<PemesananService>(PemesananService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
