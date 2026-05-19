import { IsEmail,IsIn, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateCmsUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsIn([UserRole.ADMIN, UserRole.ANALYST, UserRole.SUPPORT])
  role!: UserRole.ADMIN | UserRole.ANALYST | UserRole.SUPPORT;


  @IsString()
  @MinLength(8)
  temporaryPassword!: string;
}