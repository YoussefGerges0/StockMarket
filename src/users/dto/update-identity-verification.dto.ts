import { IsIn } from 'class-validator';

export class UpdateIdentityVerificationDto {
  @IsIn(['accepted', 'rejected'])
  status!: 'accepted' | 'rejected';
}