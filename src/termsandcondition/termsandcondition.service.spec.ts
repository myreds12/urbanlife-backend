import { Test, TestingModule } from '@nestjs/testing';
import { TermsandconditionService } from './termsandcondition.service';

describe('TermsandconditionService', () => {
  let service: TermsandconditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TermsandconditionService],
    }).compile();

    service = module.get<TermsandconditionService>(TermsandconditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
