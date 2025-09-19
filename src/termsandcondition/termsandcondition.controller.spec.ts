import { Test, TestingModule } from '@nestjs/testing';
import { TermsandconditionController } from './termsandcondition.controller';
import { TermsandconditionService } from './termsandcondition.service';

describe('TermsandconditionController', () => {
  let controller: TermsandconditionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermsandconditionController],
      providers: [TermsandconditionService],
    }).compile();

    controller = module.get<TermsandconditionController>(TermsandconditionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
