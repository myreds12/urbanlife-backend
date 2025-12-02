import { Test, TestingModule } from '@nestjs/testing';
import { AirportShuttleController } from './airport-shuttle.controller';

describe('AirportShuttleController', () => {
  let controller: AirportShuttleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirportShuttleController],
    }).compile();

    controller = module.get<AirportShuttleController>(AirportShuttleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
