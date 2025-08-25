import { Test, TestingModule } from '@nestjs/testing';
import { AboutusController } from './aboutus.controller';
import { AboutusService } from './aboutus.service';

describe('AboutusController', () => {
  let controller: AboutusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AboutusController],
      providers: [AboutusService],
    }).compile();

    controller = module.get<AboutusController>(AboutusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
