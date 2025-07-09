import { Test, TestingModule } from '@nestjs/testing';
import { PembayaranController } from './pembayaran.controller';
import { PembayaranService } from './pembayaran.service';

describe('PembayaranController', () => {
  let controller: PembayaranController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PembayaranController],
      providers: [PembayaranService],
    }).compile();

    controller = module.get<PembayaranController>(PembayaranController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
