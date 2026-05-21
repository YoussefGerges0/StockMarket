import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {Notification,NotificationDocument,NotificationType} from './schemas/notification.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    private readonly emailService: EmailService,
  ) {}

  async createNotification(
    userId: Types.ObjectId,
    userEmail: string,
    userName: string,
    type: NotificationType,
    title: string,
    message: string,
    emailHtmlContent: string,
  ) {
    const notification = await this.notificationModel.create({
      user: userId,
      type,
      title,
      message,
    });

await this.emailService.sendEmail(
  userEmail,
  userName,
  title,
  emailHtmlContent,
);

    return notification;
  }
}