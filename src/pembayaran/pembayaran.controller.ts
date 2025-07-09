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
} from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';
import { UpdatePembayaranDto } from './dto/update-pembayaran.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('pembayaran')
export class PembayaranController {
  constructor(private readonly pembayaranService: PembayaranService) {}

  @Post('invoice')
  async handleInvoiceWebhook(@Body() payload: any, @Headers('x-callback-token') token: string) {
    if (token !== process.env.XENDIT_CALLBACK_TOKEN) {
      return { message: 'Unauthorized' };
    }

    console.log('BODY:', payload);

    return this.pembayaranService.handleXenditWebhook(payload);
  }

  @UseGuards(JwtAuthGuard)
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
