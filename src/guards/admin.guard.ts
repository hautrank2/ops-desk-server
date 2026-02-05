import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

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
    if (!authHeader || typeof authHeader !== 'string')
      throw new UnauthorizedException('Missing Authorization header');

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const payload = request.payload;

    if (!payload) {
      new UnauthorizedException('Invalid or expired token');
      return false;
    }

    if (payload.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }

    return true;
  }
}
