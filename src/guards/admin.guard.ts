import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { UserRoleEnum } from 'src/schemas/user.schema';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const upsertMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

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

    if (payload?.role !== UserRoleEnum.Admin) {
      throw new ForbiddenException('Admin only');
    }

    (request as any).user = payload;

    return true;
  }
}
