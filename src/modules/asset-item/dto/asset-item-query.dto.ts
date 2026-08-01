import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus } from 'src/schemas/item.schema';
import { QueryPagination } from 'src/types/query';
import { ToStringArrayQuery } from 'src/utils/transform';

export enum AssetItemPopulationEnum {
  AssetId = 'assetId',
  UpdatedBy = 'updatedBy',
  CreatedBy = 'createdBy',
}

// Narrows the base `populations` (QueryInclude) to this module's enum.
export class AssetItemQueryDto extends QueryPagination {
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
  @IsOptional()
  @ToStringArrayQuery()
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
  @ToStringArrayQuery()
  @IsArray()
  @IsEnum(AssetItemPopulationEnum, { each: true })
  populations?: AssetItemPopulationEnum[];
}
