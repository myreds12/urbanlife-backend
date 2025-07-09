import { Test, TestingModule } from '@nestjs/testing';
import { LokasiController } from './lokasi.controller';
import { LokasiService } from './lokasi.service';

describe('LokasiController', () => {
  let controller: LokasiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LokasiController],
      providers: [LokasiService],
    }).compile();

    controller = module.get<LokasiController>(LokasiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
