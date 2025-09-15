import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyandpolicyController } from './privacyandpolicy.controller';
import { PrivacyandpolicyService } from './privacyandpolicy.service';

describe('PrivacyandpolicyController', () => {
  let controller: PrivacyandpolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivacyandpolicyController],
      providers: [PrivacyandpolicyService],
    }).compile();

    controller = module.get<PrivacyandpolicyController>(PrivacyandpolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
