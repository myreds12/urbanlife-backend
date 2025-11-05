import { Test, TestingModule } from '@nestjs/testing';
import { TypeAkomodasiService } from './type-akomodasi.service';

describe('TypeAkomodasiService', () => {
  let service: TypeAkomodasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeAkomodasiService],
    }).compile();

    service = module.get<TypeAkomodasiService>(TypeAkomodasiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
