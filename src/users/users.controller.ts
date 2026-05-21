import {Body,Controller,Param,Patch,Req,UseGuards,Post,Get} from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { CreateCmsUserDto } from './dto/create-cms-user.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from './schemas/user.schema';
import { UpdateTemporaryPasswordDto } from './dto/update-temporary-password.dto';
import { UpdateIdentityVerificationDto } from './dto/update-identity-verification.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}





@Roles(UserRole.SADMIN, UserRole.ADMIN)
@Post('cms')
createCmsUser(
  @Body() body: CreateCmsUserDto,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.usersService.createCmsUser(
    body.name,
    body.email,
    body.role,
    body.temporaryPassword,
    req.user,
  );
}




  @Roles(UserRole.SADMIN, UserRole.ADMIN)
  @Patch('status/:id')
  updateMemberStatus(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateMemberStatusDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.usersService.updateMemberStatus(
      id,
      body.status,
      body.reason,
      req.user,
    );
  }

  @Roles(UserRole.SADMIN, UserRole.ADMIN)
@Patch('cms/:id/temporary-password')
updateTemporaryPassword(
  @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  @Body() body: UpdateTemporaryPasswordDto,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.usersService.updateTemporaryPassword(
    id,
    body.temporaryPassword,
    req.user,
  );
}


@Roles(UserRole.SADMIN, UserRole.ADMIN)
@Patch('identity-verification/:id')
updateIdentityVerification(
  @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  @Body() body: UpdateIdentityVerificationDto,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.usersService.updateIdentityVerification(
    id,
    body.status,
    req.user,
  );
}


@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST,UserRole.SUPPORT)
@Get()
getAllUsers(
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.usersService.getAllUsers(req.user);
}

@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST,UserRole.SUPPORT,UserRole.INVESTOR)
@Get(':id')
getUserById(
  @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.usersService.getUserById(id, req.user);
}
}