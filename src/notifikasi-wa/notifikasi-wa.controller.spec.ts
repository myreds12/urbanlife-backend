import { Test, TestingModule } from '@nestjs/testing';
import { NotifikasiWaController } from './notifikasi-wa.controller';
import { NotifikasiWaService } from './notifikasi-wa.service';

describe('NotifikasiWaController', () => {
  let controller: NotifikasiWaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotifikasiWaController],
      providers: [NotifikasiWaService],
    }).compile();

    controller = module.get<NotifikasiWaController>(NotifikasiWaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
