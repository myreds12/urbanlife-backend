import { Test, TestingModule } from '@nestjs/testing';
import { NegaraController } from './negara.controller';
import { NegaraService } from './negara.service';

describe('NegaraController', () => {
  let controller: NegaraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NegaraController],
      providers: [NegaraService],
    }).compile();

    controller = module.get<NegaraController>(NegaraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
