import { SigninDto } from './dto/signin.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { from, map, switchMap, throwError } from 'rxjs';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  signin(dto: SigninDto) {
    const { password, username } = dto;

    return this.userService
      .findOneByFilter({ username }, { includePasswordHash: true })
      .pipe(
        switchMap(user => {
          if (!user) {
            return throwError(() => new NotFoundException('User not found'));
          }

          if (user.status === 'blocked') {
            return throwError(() => new ForbiddenException('User is blocked'));
          }

          return from(bcrypt.compare(password, user.passwordHash)).pipe(
            map((ok: boolean) => {
              if (!ok) {
                return throwError(
                  () => new UnauthorizedException('Invalid credentials'),
                );
              }

              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const userData = {
                username: user.username,
                role: user.role,
              };
              const token = this.jwtService.sign({
                username: user.username,
                role: user.role,
                userId: user._id.toString(),
              });

              return { ...userData, token };
            }),
          );
        }),
      );
  }
}
