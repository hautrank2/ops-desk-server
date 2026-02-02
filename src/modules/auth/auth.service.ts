import { SigninDto } from './dto/signin.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { from, mergeMap, Observable, switchMap, throwError } from 'rxjs';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/schemas/user.schema';
import { prettyObject } from 'src/types/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  signin(dto: SigninDto): Observable<{ token: string; user: User }> {
    const { password, username } = dto;

    return from(
      this.userService.findOneByFilter(
        { username },
        { includePasswordHash: true },
      ),
    ).pipe(
      switchMap((user: any) => {
        if (!user) {
          return throwError(() => new NotFoundException('User not found'));
        }

        if (user.status === 'blocked') {
          return throwError(() => new ForbiddenException('User is blocked'));
        }

        // bcrypt.compare returns Promise<boolean>
        return from(bcrypt.compare(password, user.passwordHash)).pipe(
          switchMap(ok => {
            if (!ok) {
              return throwError(
                () => new UnauthorizedException('Invalid credentials'),
              );
            }

            const payload = {
              sub: user._id?.toString?.() ?? user._id,
              username: user.username,
              role: user.role,
            };

            const token = this.jwtService.sign(payload);
            const { passwordHash, ...safeUser } = user;

            return from([{ token, user: safeUser as User }]);
          }),
        );
      }),
    );
  }
}
