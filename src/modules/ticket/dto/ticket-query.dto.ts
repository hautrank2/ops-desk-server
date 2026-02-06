import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TicketPriority,
  TicketStatus,
  TicketType,
} from 'src/schemas/ticket.schema';
import { QueryPagination } from 'src/types/query';
export class TicketQueryDto extends QueryPagination {
  @ApiPropertyOptional({
    description: 'Search by code (partial match)',
    example: 'OPS-000',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Search by title (partial match)',
    example: 'camera',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: TicketType })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Asset item id',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  assetItemId?: string;

  @ApiPropertyOptional({
    description: 'Location id',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Requester id',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  requesterId?: string;

  @ApiPropertyOptional({
    description: 'Assignee id',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Department id',
    example: '65f0c1b0c2a3d4e5f6789012',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Due date range start (ISO)',
    example: '2026-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDueAt?: string;

  @ApiPropertyOptional({
    description: 'Due date range end (ISO)',
    example: '2026-02-28T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDueAt?: string;

  // sort
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'dueAt', 'priority', 'status'],
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
