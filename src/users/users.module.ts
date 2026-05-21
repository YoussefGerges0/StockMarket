import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { EmailModule } from '../email/email.module';
@Module({
    imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
     EmailModule,
  ],
  controllers: [UsersController],
  providers:[UsersService]
})
export class UsersModule {}
