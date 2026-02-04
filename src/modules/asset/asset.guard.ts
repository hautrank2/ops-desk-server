import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { UPSERT_REQUEST_METHODS } from 'src/constants/common';
import { UserRoleEnum } from 'src/schemas/user.schema';

@Injectable()
export class AssetGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const upsertMethods = UPSERT_REQUEST_METHODS;
    const accessRoles = [UserRoleEnum.Admin, UserRoleEnum.Manager];
    if (!upsertMethods.includes(request.method)) return true;

    const authHeader = request.headers['authorization'];
    if (!authHeader)
      throw new UnauthorizedException('Missing Authorization header');

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (accessRoles.includes(payload?.role)) {
      throw new ForbiddenException('Admin and manager only');
    }

    (request as any).user = payload;

    return true;
  }
}
