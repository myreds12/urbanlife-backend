import { Test, TestingModule } from '@nestjs/testing';
import { KendaraanController } from './kendaraan.controller';
import { KendaraanService } from './kendaraan.service';

describe('KendaraanController', () => {
  let controller: KendaraanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KendaraanController],
      providers: [KendaraanService],
    }).compile();

    controller = module.get<KendaraanController>(KendaraanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
