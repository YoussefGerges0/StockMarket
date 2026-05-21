import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {Notification,NotificationSchema} from './schemas/notification.schema';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../email/email.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
    ]),
    EmailModule
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}