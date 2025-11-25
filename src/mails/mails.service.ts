import { Injectable } from '@nestjs/common';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { ContactUsDto } from './dto/contactus-mail.dto';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}
  create(createMailDto: CreateMailDto) {
    return 'This action adds a new mail';
  }

  findAll() {
    return `This action returns all mails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mail`;
  }

  update(id: number, updateMailDto: UpdateMailDto) {
    return `This action updates a #${id} mail`;
  }

  remove(id: number) {
    return `This action removes a #${id} mail`;
  }

  async sendTestEmail(to: string, subject: string, template: string, context?: any) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: template,
        context,
      });

      console.log('Test email sent successfully to:', to);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, message: error.message };
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to Our Service!';
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with us. We're excited to have you on board.</p>
            <p>This is a test email sent from NestJS using Mailtrap.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendTestEmail(to, subject, template, { name });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const subject = 'Password Reset Request';
    const resetLink = `${this.configService.get('APP_URL')}/reset-password?token=${resetToken}`;

    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .button { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block; 
          }
        </style>
      </head>
      <body>
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      </body>
      </html>
    `;

    return this.sendTestEmail(to, subject, template, { resetLink });
  }

  async sendOrderConfirmation(
    to: string,
    context: {
      orderId: number;
      customerName: string;
      items: string[];
      total: number;
      orderDate: string;
    },
  ) {
    const subject = `Order Confirmation #${context.orderId}`;
    // const formattedDate = new Date(context.orderDate).toLocaleDateString('id-ID', {
    //   year: 'numeric',
    //   month: 'long',
    //   day: 'numeric',
    // });

    // gabung items jadi list HTML
    const itemsHtml = context.items.map(item => `<li>${item}</li>`).join('');

    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <h2>Hi ${context.customerName},</h2>
          <p>Thank you for placing your order. Here are your order details:</p>
          <p><strong>Order ID:</strong> #${context.orderId}</p>
          <p><strong>Date:</strong> ${context.orderDate}</p>
          <p><strong>Items:</strong></p>
          <ul>
            ${itemsHtml}
          </ul>
          <p><strong>Total:</strong> Rp ${context.total.toLocaleString('id-ID')}</p>
          <p>We will process your order immediately. Thank you for trusting our service. 🙏</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return this.sendTestEmail(to, subject, template, context);
  }

  // mail.service.ts
  async sendOrderReminder(
    to: string,
    context: {
      orderId: number;
      customerName: string;
      items: string[];
      total: number;
      orderDate: Date;
      note?: string;
    },
  ) {
    const subject = `Order Reminder #${context.orderId}`;
    const formattedDate = new Date(context.orderDate).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${context.customerName},</h2>
          <p>Ini adalah pengingat bahwa pesanan dengan Order ID <strong>#${context.orderId}</strong> Anda akan segera diproses.</p>
          <p><strong>Tanggal Pesanan:</strong> ${formattedDate}</p>
          <p><strong>Item Pesanan:</strong></p>
          <ul>
            ${context.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
          <p><strong>Total:</strong> Rp ${context.total.toLocaleString('id-ID')}</p>
          ${context.note ? `<p><strong>Catatan:</strong> ${context.note}</p>` : ''}
          <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return this.sendTestEmail(to, subject, template, context);
  }

  async sendContactUsEmail(contactUsDto: ContactUsDto) {
    try {
      const { to, name, email, inquiryType, subject, message } = contactUsDto;

      const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <h2>Hi urbanlife,</h2>
          <p>Pengirim : ${name}</p>
          <p>Email: ${email}</p>
          <p>Type: ${inquiryType}</p>
          <p>Subject: ${subject}</p>
          <p>Message: ${message}</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

      return this.sendTestEmail(to, subject, template, {
        name,
        email,
        inquiryType,
        subject,
        message,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
