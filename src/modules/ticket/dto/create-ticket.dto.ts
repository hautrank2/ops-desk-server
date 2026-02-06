import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  TicketPriority,
  TicketStatus,
  TicketType,
} from 'src/schemas/ticket.schema';

export class CreateTicketDto {
  @ApiProperty({ example: 'OPS-000456' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Camera cổng A mất tín hiệu' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Mất tín hiệu từ 09:15, nghi do đứt dây nguồn',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TicketType })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.Medium })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.New })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ example: 'Adapter hỏng / mất nguồn' })
  @IsOptional()
  @IsString()
  cause?: string;

  @ApiPropertyOptional({ example: 'Đã liên hệ bảo vệ kiểm tra hiện trường' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '65f0c1b0c2a3d4e5f6789012' })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({ example: '65f0c1b0c2a3d4e5f6789012' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ example: '65f0c1b0c2a3d4e5f6789012' })
  @IsString()
  requesterId: string;

  @ApiPropertyOptional({ example: '65f0c1b0c2a3d4e5f6789012' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '65f0c1b0c2a3d4e5f6789012' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    example: '2026-02-10T10:00:00.000Z',
    description: 'ISO date string',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({
    example: '2026-02-12T10:00:00.000Z',
    description: 'ISO date string',
  })
  @IsOptional()
  @IsDateString()
  closedAt?: string;
}

export class CreateTicketFromDataDto extends CreateTicketDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload multiple images',
  })
  images: any[];
}
