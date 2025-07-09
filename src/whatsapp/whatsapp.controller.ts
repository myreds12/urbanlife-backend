import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
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

  @Post('connect')
  async connect(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    const result = await this.whatsappService.connect(sessionId);
    console.log(result);
    return result;
  }

  @Post('send')
  async send(@Body() body: { to: string; message: string }, @Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    return await this.whatsappService.sendMessage(sessionId, body.to, body.message);
  }

  @Post('logout')
  logout(@Req() req: UserRequest) {
    const sessionId = `user_${req.user.id}`;
    return this.whatsappService.logout(sessionId);
  }
}
