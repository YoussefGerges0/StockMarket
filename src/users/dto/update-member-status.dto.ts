import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserStatus } from '../schemas/user.schema';

export class UpdateMemberStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}