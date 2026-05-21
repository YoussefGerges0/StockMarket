import { IsEnum } from 'class-validator';
import { WalletTransactionStatus } from '../schemas/wallet-transaction.schema';

export class UpdateWithdrawalStatusDto {
  @IsEnum(WalletTransactionStatus)
  status!: WalletTransactionStatus;
}