import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus } from 'src/schemas/item.schema';
import { QueryCommon } from 'src/types/query';

export enum AssetItemPopulationEnum {
  AssetId = 'assetId',
  UpdatedBy = 'updatedBy',
  CreatedBy = 'createdBy',
}

export class AssetItemQueryDto extends QueryCommon {
  @ApiPropertyOptional({
    description: 'Search by code (partial match)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Search by code (partial match)',
  })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Search by location (enter specific locationId)',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Search by Asset (enter specific assetId)',
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsString()
  status?: ItemStatus;

  @ApiPropertyOptional({
    description: 'The field for Population',
    isArray: true,
    enum: AssetItemPopulationEnum,
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value as AssetItemPopulationEnum[];
    if (typeof value === 'string') return value.split(',').map(v => v.trim());
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AssetItemPopulationEnum, { each: true })
  populations?: AssetItemPopulationEnum[];
}

export class AssetItemQueryPopulation {
  @ApiPropertyOptional({
    description: 'The field for Population',
    isArray: true,
    enum: AssetItemPopulationEnum,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AssetItemPopulationEnum, { each: true })
  populations?: AssetItemPopulationEnum[];
}
