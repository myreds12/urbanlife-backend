import { Test, TestingModule } from '@nestjs/testing';
import { AkomodasiController } from './akomodasi.controller';
import { AkomodasiService } from './akomodasi.service';

describe('AkomodasiController', () => {
  let controller: AkomodasiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AkomodasiController],
      providers: [AkomodasiService],
    }).compile();

    controller = module.get<AkomodasiController>(AkomodasiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
