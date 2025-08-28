import { Test, TestingModule } from '@nestjs/testing';
import { OurPartnerService } from './our-partner.service';

describe('OurPartnerService', () => {
  let service: OurPartnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OurPartnerService],
    }).compile();

    service = module.get<OurPartnerService>(OurPartnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
