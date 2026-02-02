import {
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username!: string;

  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsIn(['admin', 'user'])
  role!: 'admin' | 'user';

  @IsOptional()
  @IsMongoId()
  deptId?: string;

  @IsOptional()
  @IsIn(['active', 'blocked'])
  status?: 'active' | 'blocked';
}
