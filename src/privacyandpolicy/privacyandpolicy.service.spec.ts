import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyandpolicyService } from './privacyandpolicy.service';

describe('PrivacyandpolicyService', () => {
  let service: PrivacyandpolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivacyandpolicyService],
    }).compile();

    service = module.get<PrivacyandpolicyService>(PrivacyandpolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
