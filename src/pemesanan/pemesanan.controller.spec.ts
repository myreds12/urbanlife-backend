import { Test, TestingModule } from '@nestjs/testing';
import { PemesananController } from './pemesanan.controller';
import { PemesananService } from './pemesanan.service';

describe('PemesananController', () => {
  let controller: PemesananController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PemesananController],
      providers: [PemesananService],
    }).compile();

    controller = module.get<PemesananController>(PemesananController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
