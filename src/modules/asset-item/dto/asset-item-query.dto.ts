import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ItemStatus } from 'src/schemas/item.schema';
import { QueryPagination } from 'src/types/query';

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
}
