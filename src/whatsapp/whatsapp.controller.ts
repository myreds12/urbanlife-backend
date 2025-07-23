import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request as IExpressRequest } from 'express';
import { User } from '@prisma/client';

interface UserRequest extends IExpressRequest {
  user: User;
}

@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  isConnected(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    const isConnected = this.whatsappService.isConnected(sessionId);
    return { sessionId, isConnected };
  }

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
    const sessionId = `user_${req.user.id}`;
    return await this.whatsappService.sendMessage(
      sessionId,
      body.to,
      body.message,
      body.pemesanan_id,
    );
  }

  @Post('logout')
  logout(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    return this.whatsappService.logout(sessionId);
  }
}
