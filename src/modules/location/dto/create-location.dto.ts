import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { FloorType } from 'src/schemas/location.schema';

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: ['B2', 'B1', 0, 1, 2, 3],
    nullable: true,
  })
  @IsOptional()
  @IsIn(['B2', 'B1', 0, 1, 2, 3])
  floor?: FloorType | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
