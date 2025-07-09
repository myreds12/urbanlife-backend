import { Test, TestingModule } from '@nestjs/testing';
import { KotaController } from './kota.controller';
import { KotaService } from './kota.service';

describe('KotaController', () => {
  let controller: KotaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KotaController],
      providers: [KotaService],
    }).compile();

    controller = module.get<KotaController>(KotaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
