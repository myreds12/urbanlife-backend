import { Test, TestingModule } from '@nestjs/testing';
import { PortShuttleController } from './port-shuttle.controller';

describe('PortShuttleController', () => {
  let controller: PortShuttleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortShuttleController],
    }).compile();

    controller = module.get<PortShuttleController>(PortShuttleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
