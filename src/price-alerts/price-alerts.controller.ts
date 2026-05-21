import { Body, Controller, Param, Post, Req, UseGuards,Get,Delete } from '@nestjs/common';
import { Types } from 'mongoose';
import { PriceAlertsService } from './price-alerts.service';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';


@UseGuards(AuthGuard, RolesGuard)
@Controller('price-alerts')
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Roles(UserRole.INVESTOR)
  @Post(':stockId')
  createPriceAlert(
    @Param('stockId', ParseObjectIdPipe) stockId: Types.ObjectId,
    @Body() body: CreatePriceAlertDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.priceAlertsService.createPriceAlert(
      stockId,
      body.targetPrice,
      body.direction,
      req.user,
    );
  }



  @Roles(UserRole.SADMIN, UserRole.ADMIN, UserRole.INVESTOR)
@Get('user/:userId')
getAllPriceAlertsByUserId(
  @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.priceAlertsService.getAllPriceAlertsByUserId(
    userId,
    req.user,
  );
}



@Roles(UserRole.INVESTOR)
@Delete(':alertId')
removePriceAlert(
  @Param('alertId', ParseObjectIdPipe) alertId: Types.ObjectId,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.priceAlertsService.removePriceAlert(alertId, req.user);
}


}