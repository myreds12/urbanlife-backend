import { Test, TestingModule } from '@nestjs/testing';
import { TypeAkomodasiController } from './type-akomodasi.controller';
import { TypeAkomodasiService } from './type-akomodasi.service';

describe('TypeAkomodasiController', () => {
  let controller: TypeAkomodasiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeAkomodasiController],
      providers: [TypeAkomodasiService],
    }).compile();

    controller = module.get<TypeAkomodasiController>(TypeAkomodasiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
