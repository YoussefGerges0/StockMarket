import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmail(
    userEmail: string,
    userName: string,
    subject: string,
    htmlContent: string,
  ) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    const senderName = this.configService.get<string>('BREVO_SENDER_NAME');

    if (!apiKey || !senderEmail || !senderName) {
      throw new BadRequestException('Brevo email configuration is missing');
    }

    const body = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: userEmail,
          name: userName,
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to send email');
    }

    return {
      message: 'Email sent successfully',
    };
  }
}