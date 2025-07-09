import { Test, TestingModule } from '@nestjs/testing';
import { AkomodasiService } from './akomodasi.service';

describe('AkomodasiService', () => {
  let service: AkomodasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AkomodasiService],
    }).compile();

    service = module.get<AkomodasiService>(AkomodasiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
