import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AssetType } from 'src/schemas/asset.schema';
import { QueryCommon } from 'src/types/query';

// Asset only populates user refs; it consumes the generic `populations`
// (string[]) inherited from QueryCommon — see QueryInclude in src/types/query.
export class AssetQueryDto extends QueryCommon {
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
    description: 'Include item count summary',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  itemCount?: boolean;
}
