import { Test, TestingModule } from '@nestjs/testing';
import { ServiceScheduleController } from './service-schedule.controller';
import { ServiceScheduleService } from './service-schedule.service';

describe('ServiceScheduleController', () => {
  let controller: ServiceScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceScheduleController],
      providers: [ServiceScheduleService],
    }).compile();

    controller = module.get<ServiceScheduleController>(ServiceScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
