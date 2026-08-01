import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ToStringArrayQuery } from 'src/utils/transform';

export class QueryPagination {
  // pagination
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

/**
 * Base "populations" field. Each module DTO extends {@link QueryCommon} and
 * re-declares `populations` narrowed to its own PopulationEnum via
 * `@IsEnum(SomeEnum, { each: true })` — inheriting this array/transform shape.
 */
export class QueryInclude {
  @ApiPropertyOptional({
    type: [String],
    example: ['createdBy', 'updatedBy'],
  })
  @IsOptional()
  @ToStringArrayQuery()
  @IsArray()
  @IsString({ each: true })
  populations?: string[];
}

export class QueryCommon extends IntersectionType(
  QueryPagination,
  QueryInclude,
) {}

export type QueryPopulateModel = {
  path: string;
  select: string;
};
