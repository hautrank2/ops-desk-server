import { SigninDto } from './dto/signin.dto';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // signin(dto: SigninDto): Observable<{ token: string; user: User }> {
  //   const { password, ...restDto } = dto;

  //   // return from(
  //   //   this.userService.findOneByQuery(prettyObject(restDto)).pipe(
  //   //     mergeMap((userRes) => {
  //   //       const user = userRes?.toObject();
  //   //       if (!user) {
  //   //         return throwError(
  //   //           new UnauthorizedException(
  //   //             'Username, email or phone number not found',
  //   //           ),
  //   //         );
  //   //       }
  //   //       return from(bcrypt.compare(password, userRes?.password ?? '')).pipe(
  //   //         mergeMap((isMatch) => {
  //   //           console.log('isMatch', isMatch);
  //   //           if (!isMatch) {
  //   //             return throwError(
  //   //               new UnauthorizedException('Invalid password'),
  //   //             );
  //   //           }

  //   //           return from(this.jwtService.signAsync(user)).pipe(
  //   //             map((token) => ({ token, user })),
  //   //           );
  //   //         }),
  //   //       );
  //   //     }),
  //   //   ),
  //   // );
  // }
}
