import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SigninDto } from './dto/signin.dto';
import { AuthService } from './auth.service';
import { ValidTokenGuard } from 'src/guards/valid-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @Get('valid-token')
  @UseGuards(ValidTokenGuard)
  checkToken() {
    return {
      valid: true,
    };
  }
}
