import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MailsService } from './mails.service';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { ContactUsDto } from './dto/contactus-mail.dto';

@Controller('mails')
export class MailsController {
  constructor(private readonly mailsService: MailsService) {}

  @Post('test')
  async sendTestEmail(@Body() body: { email: string; name: string }) {
    return this.mailsService.sendWelcomeEmail(body.email, body.name);
  }

  @Post('welcome')
  async sendWelcomeEmail(@Body() body: { email: string; name: string }) {
    return this.mailsService.sendWelcomeEmail(body.email, body.name);
  }

  @Get('health')
  async healthCheck() {
    return { status: 'Mail service is healthy' };
  }

  @Post()
  create(@Body() createMailDto: CreateMailDto) {
    return this.mailsService.create(createMailDto);
  }

  @Get()
  findAll() {
    return this.mailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMailDto: UpdateMailDto) {
    return this.mailsService.update(+id, updateMailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mailsService.remove(+id);
  }

  @Post('contactus')
  async sendContactUsEmail(@Body() contactUsDto: ContactUsDto) {
    return this.mailsService.sendContactUsEmail(contactUsDto)
  }
}
