import { Test, TestingModule } from '@nestjs/testing';
import { OurPartnerController } from './our-partner.controller';
import { OurPartnerService } from './our-partner.service';

describe('OurPartnerController', () => {
  let controller: OurPartnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OurPartnerController],
      providers: [OurPartnerService],
    }).compile();

    controller = module.get<OurPartnerController>(OurPartnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
