import { Test, TestingModule } from '@nestjs/testing';
import { AboutusService } from './aboutus.service';

describe('AboutusService', () => {
  let service: AboutusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AboutusService],
    }).compile();

    service = module.get<AboutusService>(AboutusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
