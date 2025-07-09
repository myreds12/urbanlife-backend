import { Test, TestingModule } from '@nestjs/testing';
import { PembayaranService } from './pembayaran.service';

describe('PembayaranService', () => {
  let service: PembayaranService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PembayaranService],
    }).compile();

    service = module.get<PembayaranService>(PembayaranService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
