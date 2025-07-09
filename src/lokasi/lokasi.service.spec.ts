import { Test, TestingModule } from '@nestjs/testing';
import { LokasiService } from './lokasi.service';

describe('LokasiService', () => {
  let service: LokasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LokasiService],
    }).compile();

    service = module.get<LokasiService>(LokasiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
