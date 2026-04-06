import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { FloorType } from 'src/schemas/location.schema';
import { QueryPagination } from 'src/types/query';

export class LocationQueryDto extends QueryPagination {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: ['B2', 'B1', 0, 1, 2, 3],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (!isNaN(Number(value)) && ['0', '1', '2', '3'].includes(value)) {
      return Number(value);
    }
    return value;
  })
  @IsIn(['B2', 'B1', 0, 1, 2, 3])
  floor?: FloorType;

  @ApiPropertyOptional({
    description: 'true | false',
  })
  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
