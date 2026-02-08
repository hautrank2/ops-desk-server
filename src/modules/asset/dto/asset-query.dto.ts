import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AssetType } from 'src/schemas/asset.schema';
import { QueryPagination } from 'src/types/query';

export enum AssetPopulation {
  CreatedBy = 'createdBy',
  UpdatedBy = 'updatedBy',
}
export class AssetQueryDto extends QueryPagination {
  @ApiPropertyOptional({
    description: 'Search by code (partial match)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Search by name (partial match)',
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
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Filter by model (partial match)',
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
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  // sort
  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'code', 'name', 'type', 'active'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'The field for Population',
    isArray: true,
    enum: AssetPopulation,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AssetPopulation, { each: true })
  populations?: AssetPopulation[];
}
