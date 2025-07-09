import { Test, TestingModule } from '@nestjs/testing';
import { TravelPackageController } from './travel-package.controller';
import { TravelPackageService } from './travel-package.service';

describe('TravelPackageController', () => {
  let controller: TravelPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelPackageController],
      providers: [TravelPackageService],
    }).compile();

    controller = module.get<TravelPackageController>(TravelPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
