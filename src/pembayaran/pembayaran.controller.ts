import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Headers,
  Query,
  Logger,
} from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';
import { UpdatePembayaranDto } from './dto/update-pembayaran.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('pembayaran')
export class PembayaranController {
  private readonly logger = new Logger(PembayaranController.name);

  constructor(private readonly pembayaranService: PembayaranService) {}

  @Post('xendit')
  async handleXenditWebhook(@Body() payload: any, @Headers('x-callback-token') token: string) {
    // this.logger.log(`Webhook received from: ${userAgent}`);

    // Verify webhook token
    if (token !== process.env.XENDIT_CALLBACK_TOKEN) {
      this.logger.warn('Unauthorized webhook attempt');
      return { message: 'Unauthorized' };
    }

    this.logger.debug('Webhook payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await this.pembayaranService.handleXenditWebhook(payload);
      this.logger.log('Webhook processed successfully');
      return result;
    } catch (error) {
      this.logger.error('Webhook processing failed:', error.message);
      throw error;
    }
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createPembayaranDto: CreatePembayaranDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.pembayaranService.create(createPembayaranDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() queryParams: QueryParamsDto) {
    return this.pembayaranService.findAll(queryParams);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pembayaranService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updatePembayaranDto: UpdatePembayaranDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.pembayaranService.update(+id, updatePembayaranDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pembayaranService.remove(+id);
  }
}
