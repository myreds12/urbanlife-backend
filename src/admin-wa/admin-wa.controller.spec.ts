import { Test, TestingModule } from '@nestjs/testing';
import { AdminWaController } from './admin-wa.controller';
import { AdminWaService } from './admin-wa.service';

describe('AdminWaController', () => {
  let controller: AdminWaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminWaController],
      providers: [AdminWaService],
    }).compile();

    controller = module.get<AdminWaController>(AdminWaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
