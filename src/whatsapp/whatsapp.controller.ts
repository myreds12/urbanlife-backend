import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request as IExpressRequest } from 'express';
import { User } from '@prisma/client';
import { CreateTemplateWhatsappDto } from './dto/create-template-whatsapp.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { UpdateTemplateWhatsappDto } from './dto/update-template-whatsapp.dto';

interface UserRequest extends IExpressRequest {
  user: User;
}

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(JwtAuthGuard)
  @Post('')
  async createTemplate(@Body() dto: CreateTemplateWhatsappDto) {
    return await this.whatsappService.createTemplate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('message')
  async findAllMessage(@Query() query: QueryParamsDto) {
    return await this.whatsappService.findAllMessage(query);
  }
  @UseGuards(JwtAuthGuard)
  @Get('')
  async findAllTemplate(@Query() query: QueryParamsDto) {
    return await this.whatsappService.findAllTemplate(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOneTemplate(@Param('id') id: number) {
    return await this.whatsappService.findOneTemplate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTemplate(@Param('id') id: number, @Body() dto: UpdateTemplateWhatsappDto) {
    return await this.whatsappService.updateTemplate(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTemplate(@Param('id') id: number) {
    return await this.whatsappService.deleteTemplate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  isConnected(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    const isConnected = this.whatsappService.isConnected(sessionId);
    return { sessionId, isConnected };
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connect(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    console.log(req.user, 'user data from request');
    const user = {
      id: req.user.id,
    };
    const result = await this.whatsappService.connect(sessionId, user);
    return result;
  }

  @Post('send')
  async send(
    @Body() body: { to: string; message: string; pemesanan_id: number },
    @Req() req: UserRequest,
  ) {
    console.log(req.user, 'user data from request');
    const sessionId = `user_73`;
    return await this.whatsappService.sendMessage(
      sessionId,
      body.to,
      body.message,
      body.pemesanan_id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    return this.whatsappService.logout(sessionId);
  }
}
