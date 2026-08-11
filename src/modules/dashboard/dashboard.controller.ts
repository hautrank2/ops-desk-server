import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ValidTokenGuard } from 'src/guards/valid-token.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(ValidTokenGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  getAdminOverview(@Req() request: Request) {
    this.assertRole(request, ['admin']);
    return this.dashboardService.getAdminOverview();
  }

  @Get('manager')
  getManagerOverview(@Req() request: Request) {
    this.assertRole(request, ['admin', 'manager']);
    return this.dashboardService.getManagerOverview();
  }

  @Get('user')
  getUserOverview(@Req() request: Request) {
    if (!request.payload) {
      throw new ForbiddenException('Invalid Authorization');
    }
    return this.dashboardService.getUserOverview(request.payload.userId);
  }

  private assertRole(request: Request, allowed: string[]) {
    if (!request.payload) {
      throw new ForbiddenException('Invalid Authorization');
    }
    if (!allowed.includes(request.payload.role)) {
      throw new ForbiddenException('Not allowed for this role');
    }
  }
}
