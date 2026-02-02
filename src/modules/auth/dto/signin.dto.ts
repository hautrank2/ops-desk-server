import { IsNotEmpty, IsOptional } from 'class-validator';

export class SigninDto {
  @IsOptional()
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
