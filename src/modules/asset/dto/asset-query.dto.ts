import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AssetType } from 'src/schemas/asset.schema';
import { QueryPagination } from 'src/types/query';

export class AssetQueryDto extends QueryPagination {
  @ApiPropertyOptional({
    description: 'Search by code (partial match)',
    example: 'CAM-',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Search by name (partial match)',
    example: 'Hikvision',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @ApiPropertyOptional({
    description: 'Filter by vendor (partial match)',
    example: 'Hikvision',
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Filter by model (partial match)',
    example: 'DS-2CD2143',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Created by userId',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  // sort
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'code', 'name', 'type', 'active'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';
}
